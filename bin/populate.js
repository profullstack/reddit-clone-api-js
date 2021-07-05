#!/bin/env node

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
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Imthcm1hIjo0MzQyMTcsInVzZXJuYW1lIjoiY2hvdnkiLCJhZG1pbiI6dHJ1ZSwiYml0Y29pbkFkZHJlc3MiOiJiYzFxNnh4ZmVsazV1ODZjczU5dXc1MjhkejlncjN3aGh4YWpxY2RqMjIiLCJsaW5rcyI6W3siX2lkIjoiNjA1Yzg0YzA3ZWQzZTMwMDFkYjViZGQwIiwibmFtZSI6IkBjaG92eSIsInVybCI6Imh0dHBzOi8vdHdpdHRlci5jb20vY2hvdnkifSx7Il9pZCI6IjYwNWM4NGMwN2VkM2UzMDAxZGI1YmRjZiIsIm5hbWUiOiJKYXZhU2NyaXB0IENvbnN1bHRpbmciLCJ1cmwiOiJodHRwczovL3Byb2Z1bGxzdGFjay5jb20ifV0sImFwaUtleXMiOlt7ImtleU5hbWUiOiJibG9ncyIsImtleSI6IjkyZWNjMWQ5LTkxOGQtNGIyMC05NmM0LThiMDQxMThiNzBlMSJ9XSwibmltaXFBZGRyZXNzIjoiTlE4OCBRRVNCIE5RS00gWEtFVSBCUEUyIExWRzAgWVM1TiBNUENDIEw0VkIiLCJpZCI6IjVlNGRhYzI0NWE2OTMwMDAxZDliYWQ5NyJ9LCJpYXQiOjE2MjI3MDQ2ODgsImV4cCI6MTY1NDI0MDY4OH0.3Lj7rGmpq3HAoa9RYLoujcgBqe7vX9d-315WYYAfGqc',
      },
      body: JSON.stringify({
        category: '5e52bacdbdbc8100286fbf63',
        type: 'link',
        url: 'https://briskreader.com/link/' + item.shortId,
        hashtags: [],
        title: item.title,
        thumb: item.meta.thumb,
      }),
    });
    const data2 = await res2.json();
    console.log(data2.id);
  }
}

start();
