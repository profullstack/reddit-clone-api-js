import { body, validationResult } from 'express-validator';
import Category from '../models/category';
import User from '../models/user';

export const create = async (req, res, next) => {
  const { name, description } = req.body;
  const owner = req.user.id;
  const category = await Category.create({ name, description, owner });
  await User.findOneAndUpdate({ _id: req.user.id }, { $inc: { karma: 10 } });

  res.status(201).json(category);
};

export const list = async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
};

export const fetchCategory = async (req, res) => {
  const name = req.params.categoryName;
  const category = await Category.findOne({ name });
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

      .isLength({ max: 200 })
      .withMessage('must be at most 200 characters long'),
  ];

  validations.push(
    body('name').custom(async name => {
      const exists = await Category.countDocuments({ name });
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

export default {
  create,
  list,
  validate,
  fetchCategory
};
