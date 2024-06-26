const { readdirSync } = require('fs');
const { join } = require('path');

for (let t of readdirSync(join(__dirname, 'exports')).filter(f => !f.includes('.'))) {
    readdirSync(join(__dirname, 'exports', t)).filter(f => f.endsWith('.js') && !['index.js', 'save.js'].includes(f)).map(f => {
        exports[f.split('.')[0]] = require(`${__dirname}/exports/${t}/${f}`);
    });
}
