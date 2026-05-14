# Reference edge import

Put external concept-graph edge files in this directory, then merge them into `index.html` with:

```bash
node scripts/merge-reference-edges.js reference/tier1-tier2-edges.json
```

Supported JSON shape:

```json
[
  {
    "from": "分数的意义",
    "to": "小数的意义",
    "type": "related_to",
    "group": "representation_bridge",
    "critical": true,
    "exp": "分数和小数是同一个数的两种表达。",
    "source": "reference"
  }
]
```

`from` and `to` can use either concept names or node ids. `type` must be `prerequisite_of` or `related_to`; `group` should be one of `dependency`, `representation_bridge`, `spatial_structure`, `number_structure`, `data_reasoning`, `unit_transfer`, `application`, or `cross_category`.
