const fs = require('fs');

const oracleServiceInterface = fs.readFileSync(__dirname + '/../contracts/OracleServiceInterface.aes', 'utf-8');

fs.writeFileSync(__dirname + '/../OracleServiceInterface.aes.js', `module.exports = \`\n${oracleServiceInterface}\`;\n`, 'utf-8');
