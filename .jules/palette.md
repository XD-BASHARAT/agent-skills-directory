## 2024-05-23 - Avoid Invalid Button Nesting with asChild
**Learning:** Found `<Link><Button>...</Button></Link>` pattern which creates invalid `<a><button>` nesting, causing accessibility issues.
**Action:** Use `<Button asChild><Link>...</Link></Button>` pattern to apply button styles to the link element directly.
