import { Client } from '@elastic/elasticsearch';
const search = new Client({ node: process.env.ELASTIC_SEARCH_URI });

console.log(process.env.ELASTIC_SEARCH_URI);

export default search;