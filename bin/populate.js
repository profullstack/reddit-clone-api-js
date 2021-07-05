#!/bin/env node

require('dotenv').config();
import fetch from 'node-fetch';

async function start() {
  const recent = 'https://briskreader.com/api/1/recent';
  const res = await fetch(recent);
  const data = await res.json();

  for (let item of data) {
    console.log(item.shortId);

    const res2 = await fetch('https://upvotocracy.com/api/1/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.AUTH_BRISKREADER,
      },
      body: JSON.stringify({
        category: process.env.BR_CAT_NEWS,
        type: 'link',
        url: 'https://briskreader.com/link/' + item.shortId,
        hashtags: item.summary.topics,
        title: item.title,
        thumb: item.meta.thumb,
      }),
    });
    const data2 = await res2.json();
    console.log(data2.id);
  }
}

start();
