#!/bin/sh

cd "$(dirname "$0")/.."
. $HOME/.zshrc
node -v
node -r esm ./bin/populate.js
