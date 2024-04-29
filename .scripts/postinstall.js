const fs = require('fs');

const oracleService = fs.readFileSync(__dirname + '/../contracts/OracleService.aes', 'utf-8');
fs.writeFileSync(__dirname + '/../generated/OracleService.aes.js', `module.exports = \`\n${oracleService}\`;\n`, 'utf-8');

const oracleGetter = fs.readFileSync(__dirname + '/../contracts/OracleGetter.aes', 'utf-8');
fs.writeFileSync(__dirname + '/../generated/OracleGetter.aes.js', `module.exports = \`\n${oracleGetter}\`;\n`, 'utf-8');
