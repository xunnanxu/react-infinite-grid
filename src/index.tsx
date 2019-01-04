import * as React from "react";
import * as ReactDOM from "react-dom";

import data from '../data.json';
import { Grid } from "./grid";

const columnMappings = [
  {
    key: 'id',
    name: 'ID',
    className: 'table-column-30'
  },
  {
    key: 'name',
    name: 'Name',
    className: 'table-column-70'
  }
];

ReactDOM.render(
    <Grid data={data} tableTitleHeight={56} container={window} columnMappings={columnMappings} searchKey="name" showAll={false}/>,
    document.getElementById("example")
);
