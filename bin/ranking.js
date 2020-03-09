import mongoose from 'mongoose'
import Item from '../models/post'
const log = require('debug');
const dotenv = require('dotenv');
dotenv.config();

const debug = log('express-starter:db');

console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
  keepAlive: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
});
mongoose.connection.on('connected', () => debug('successfully connected to db'));
mongoose.connection.on('error', console.error);

function getRankedItems(callback) {
  Item.aggregate([
    {
      $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "a"
      }
    },
    {
      $unwind: '$a'
    },
    { $project: 
      {
        _id: "$_id",
        title: "$title",
        url: "$url",
        thumb: "$thumb",
        author: "$author",
        category: "$category",
        score: "$score",
        votes: "$votes",
        comments: "$comments",
        created: "$created",
        views: "$views",
        type: "$type",
        text: "$text",
        ranking: { 
          $divide: [
            { $add: [
              "$score",
              { $multiply: ["$comments".length, 0.08] },
              { $multiply: ["$views", 0.002] },
              { $multiply: ["$a.karma", 0.002] },
              0.75
            ] }, //end $add
            { $add: [
              1,
              { $subtract: [
                { $multiply: [ // this is a workaround for mongo version 3.0 (no $pow)
                  { $multiply: [
                    { $divide: [{ $subtract: [ new Date(), "$created" ] },14400000]},
                    .4
                  ] }, //end $multiply
                  { $multiply: [
                    { $divide: [{ $subtract: [ new Date(), "$created" ] },14400000]},
                    .4
                  ] } //end $multiply
                ] }, //end $multiply
                { $multiply: [ // this is a workaround for mongo version 3.0 (no $pow)
                  { $multiply: [                    
                    { $divide: [{ $subtract: [ new Date(), "$created" ] },14400000]},
                    .3
                  ] }, //end $multiply
                  { $multiply: [
                    { $divide: [{ $subtract: [ new Date(), "$created" ] },14400000]},
                    .3
                  ] } //end $multiply
                ] } //end $multiply
              ] } //end $subtract
            ] } //end $add
          ] } //end $divide
        }
      }, //end $project
      { $sort: { ranking: -1 } },
      { $out: 'posts' },
    ],
    function(err, results) {
      if (err) {
        console.log(err);
        return callback(err);
      }
      console.log('ranked')
    }
  ); //end Items.aggregate
}
getRankedItems()