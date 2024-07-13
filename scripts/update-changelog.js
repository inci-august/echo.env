const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

function getNextVersion(currentVersion, updateType) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  switch (updateType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error('Invalid update type');
  }
}

function updateChangelog(nextVersion) {
  const currentDate = new Date().toISOString().split('T')[0];

  let changelogContent = fs.readFileSync(changelogPath, 'utf8');

  const newEntry = `
## [${nextVersion}] - ${currentDate}

### Added
-

### Changed
-

### Fixed
-

`;

  changelogContent = changelogContent.replace(
    '# Changelog\n',
    `# Changelog\n${newEntry}`
  );

  fs.writeFileSync(changelogPath, changelogContent);
  console.log(
    `Update CHANGELOG.md for version ${nextVersion} and push your changes`
  );

  const editor = 'code';
  const editorProcess = spawn(editor, [changelogPath], { stdio: 'inherit' });

  editorProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Editor process exited with code ${code}`);
    }
    process.exit(0);
  });
}

const updateType = process.argv[2].replace('prepare-', '');
const packageJson = require(packageJsonPath);
const currentVersion = packageJson.version;
const nextVersion = getNextVersion(currentVersion, updateType);

updateChangelog(nextVersion);
