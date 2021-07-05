#!/bin/env zsh

. ~/.zshrc

cd "$(dirname "$0")"
node -v
node -r esm ./populate.js
