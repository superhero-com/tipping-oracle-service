const fs = require('fs');

const oracleServiceInterface = fs.readFileSync(__dirname + '/../contracts/OracleServiceInterface.aes', 'utf-8');
fs.writeFileSync(__dirname + '/../OracleServiceInterface.aes.js', `module.exports = \`\n${oracleServiceInterface}\`;\n`, 'utf-8');

const oracleGetter = fs.readFileSync(__dirname + '/../contracts/OracleGetter.aes', 'utf-8');
fs.writeFileSync(__dirname + '/../OracleGetter.aes.js', `module.exports = \`\n${oracleGetter}\`;\n`, 'utf-8');
