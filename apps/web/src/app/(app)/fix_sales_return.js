const fs = require('fs');

const files = [
  {
    path: 'c:/Lekhaly/apps/web/src/app/(app)/sales-return/create/page.tsx',
    from: 'function SalesReturnCreateContent() {\r\n    const [mounted, setMounted] = React.useState(false);\r\n\r\n    const invoiceDateRef',
    to: 'function SalesReturnCreateContent() {\r\n    const [mounted, setMounted] = React.useState(false);\r\n    const searchParamsForSkip = useSearchParams();\r\n    const isEditModeForSkip = !!searchParamsForSkip.get("id");\r\n    const { preview: nextReturnPreview } = useNextVoucherNumber("salesReturn", isEditModeForSkip);\r\n\r\n    const invoiceDateRef',
    also: [
      { from: '        invoiceNoDisplay: "System generated",\r\n        referenceNo: "",', to: '        invoiceNoDisplay: nextReturnPreview,\r\n        referenceNo: "",' }
    ]
  }
];

for (const f of files) {
  let content = fs.readFileSync(f.path, 'utf8');
  if (content.includes(f.from)) {
    content = content.replace(f.from, f.to);
    console.log('Applied main replacement to', f.path);
  } else {
    console.log('WARN: main from-string not found in', f.path);
  }
  for (const a of (f.also || [])) {
    if (content.includes(a.from)) {
      content = content.replace(a.from, a.to);
      console.log('Applied also replacement to', f.path);
    } else {
      console.log('WARN: also from-string not found in', f.path);
    }
  }
  fs.writeFileSync(f.path, content);
}
console.log('Done');
