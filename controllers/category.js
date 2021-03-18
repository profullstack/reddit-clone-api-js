import { body, validationResult } from 'express-validator';
import Category from '../models/category';
import User from '../models/user';
import { cache, getAsync, setAsync } from '../cache';

export const create = async (req, res, next) => {
  const {
    name, description, nsfw, image,
  } = req.body;
  const owner = req.user.id;
  const category = await Category.create({
    name, description, owner, nsfw, image,
  });
  await User.findOneAndUpdate({ _id: req.user.id }, { $inc: { karma: 10 } });

  cache.del('/categories');
  res.status(201).json(category);
};

export const list = async (req, res) => {
  const cached = await getAsync('/categories').catch(console.error);

  if (cached) {
    console.log('categories cached');
    res.json(JSON.parse(cached));
    return;
  }

  const categories = await Category.find().sort('-subscriberCount');
  const cacheRes = await setAsync('/categories', JSON.stringify(categories)).catch(console.error);
  cache.expire('/categories', 60);
  console.log('categories cache set');

  res.json(categories);
};

export const fetchCategory = async (req, res) => {
  const name = req.params.categoryName;
  const category = await Category.findOne({ name }).populate({ path: 'owner', select: '-inbox' });

  res.json(category);
};

export const validate = async (req, res, next) => {
  const validations = [
    body('name')
      .exists()
      .withMessage('is required')

      .isLength({ min: 1 })
      .withMessage('cannot be blank')

      .isLength({ max: 20 })
      .withMessage('must be at most 20 characters long')

      .custom(value => value.trim() === value)
      .withMessage('cannot start or end with whitespace')

      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('contains invalid characters'),

    body('description')
      .exists()
      .withMessage('is required')

      .isLength({ min: 1 })
      .withMessage('cannot be blank')

      .isLength({ min: 8 })
      .withMessage('must be at least 8 characters long')

      .isLength({ max: 2000 })
      .withMessage('must be at most 2000 characters long'),
  ];

  validations.push(
    body('name').custom(async name => {
      const exists = await Category.countDocuments({ name, _id: { $ne: req.body._id } });
      if (exists) throw new Error('already exists');
    }),
  );

  await Promise.all(
    validations.map(validation => {
      if (!('run' in validation)) return;
      return validation.run(req);
    }),
  );

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  res.status(422).json({ errors: errors.array({ onlyFirstError: true }) });
};

export const update = async (req, res) => {
  const {
    _id, name, description, nsfw, image,
  } = req.body;
  const owner = req.user.id;
  const newData = {
    name,
    description,
    owner,
    nsfw,
  };
  if (image != null) newData.image = image;

  const user = await User.findOne({ _id: req.user.id });
  const category = await Category.findOne({ _id });
  const allowed = await user.canEditCategory(category);

  if (allowed) {
    const updated = await Category.findOneAndUpdate({ _id, owner }, newData);

    if (updated == null) return res.status(404).send();

    cache.del('/categories');
    res.status(200).json({ status: 'success' });
  } else {
    res.status(401).json({ status: 'unauthorized' });
  }
};

export const deleteCategory = async (req, res) => {
  const user = await User.findOne({ _id: req.user.id });
  const category = await Category.findOne({ _id: req.params.categoryID });
  const allowed = await user.canEditCategory(category);

  if (allowed) {
    const deleted = await Category.deleteOne({ _id: req.params.categoryID });
    if (deleted != null) {
      res.status(200).json({ status: 'deleted' });
      cache.del('/categories');
    }
  } else {
    res.status(401).json({ status: 'unauthorized' });
  }
};

export default {
  create,
  list,
  validate,
  fetchCategory,
  update,
  deleteCategory,
};
