import * as fs from 'fs';
let settingsCounter = 0;

/**
 * Basic utility
 */
const isProperty = (line) => {
  return (
    line.startsWith('id:') ||
    line.startsWith('type:') ||
    line.startsWith('default:') ||
    line.startsWith('content:') ||
    line.startsWith('reference:') ||
    line.startsWith('reference_default:')
  )
}

const isSelectProperty = (line) => {
  return (line.includes('|'));
}

const announcer = (type, ...msg) => {
  const warning = (text) => `\x1b[33m ${text} \x1b[0m`;
  const success = (text) => `\x1b[32m ${text} \x1b[0m`;
  const error = (text) => `\x1b[31m ${text} \x1b[0m`;
  
  switch(type) {
    case 'err':
      error(msg);
      return;
    case 'success':
      console.log(success(msg));
      return;
    case 'warning':
      console.log(warning(msg));
      return;
    default:
      console.log(msg);
      return;
  };
}

const buildOption = (chunk) => {
  let options = [];
  let obj = {};
  chunk.forEach((option, i) => {
    if (!isProperty(chunk[i])) {
      let propIndex = option.indexOf('|');
      let i18nValue = option.slice(0, propIndex);
      let configValue = option.slice(propIndex + 1, option.length);
      obj['label'] = i18nValue;
      obj['value'] = configValue;
      options.push(obj);
      obj = {};
    };
  });
  return options;
}

const chunkBuilder = (lines) => {
  let chunks = [];
  let chunk = [];
  for (let i = 0; i < lines.length; i++) {
    if (isProperty(lines[i]) || isSelectProperty(lines[i]) || chunk.length === 0) {
      chunk.push(lines[i]);
    };

    if (i+1 === lines.length) break;

    if (!(isSelectProperty(lines[i+1]) || isProperty(lines[i+1]))) {
      chunks.push(chunk);
      chunk = [];
      chunk.push(lines[i+1]);
    }
  }
  chunks.push(chunk);
  return chunks;
}

const buildSetting = (chunk) => {
  let obj = {};
  let err = null;
  let settingDescription = chunk.shift();
  chunk.forEach((line, i) => {
    const propIndex = line.indexOf(':');
    let value = null;
    console.log(line);
    if (propIndex !== -1) {
      const prop = line.slice(0, propIndex);
      value = line.slice(propIndex + 2, line.length);
      obj[prop] = value;
    }

    if (value === 'select') {
      const mirror = [...chunk];
      obj['option'] = buildOption(mirror.splice(i+1));
    }
  });

  if (obj['type'] === 'heading') {
    obj['content'] = settingDescription;
  } else {  
    obj['label'] = settingDescription;
  }
  settingsCounter++;

  return [obj, err];
}

const settingsBuilder = (chunks) => {
  let settings = [];
  let errs = [];
  chunks.forEach(chunk => {
    const [setting, error] = buildSetting(chunk);
    if (setting) {
      settings.push(setting);
    } else {
      errs.push(error);
    }
  })

  return [settings, errs];
}

const main = () => {
  fs.readFile('file.txt', 'utf-8', (err, data) => {
    if (err) {
      console.error('File doesn\'t exist. file.txt needs to be present at the directory');
    }
    const lines = data.split(/\r?\n|\r|\n/g);
    const settingsChunk = chunkBuilder(lines);
    const [settings, errs] = settingsBuilder(settingsChunk);
    fs.writeFile('schema.json', JSON.stringify(settings, null, 2), (err) => {
      if (err) return announcer('err', 'Error while writing data');
      return announcer('success', 'Schema.json completed. Wrote ', settingsCounter, ' settings');
    });
  });
};

main();