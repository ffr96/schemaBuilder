import * as fs from 'fs';
let settingsCounter = 0;

const buildOption = (chunk) => {
  let options = [];
  let obj = {};
  console.log(chunk);
  chunk.forEach((option, i) => {
    if (!isProperty(chunk[i])) {
      let propIndex = option.indexOf('|');
      let i18nValue = option.slice(0, propIndex);
      console.log(i18nValue);
      let configValue = option.slice(propIndex + 1, option.length);
      obj['label'] = i18nValue;
      obj['value'] = configValue;
      options.push(obj);
      obj = {};
    };
  });
  return options;
}

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
  return chunks;
}

const buildSetting = (chunk) => {
  let obj = {};
  let err = null;
  let settingDescription = chunk.shift();
  chunk.forEach((line, i) => {
    const propIndex = line.indexOf(':');
    let value = null;
    if (propIndex !== -1) {
      const prop = line.slice(0, propIndex);
      value = line.slice(propIndex + 2, line.length);
      obj[prop] = value;
    }

    if (value === 'select') {
      obj['option'] = buildOption(chunk.splice(i+1));
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
      if (err) console.error('Error while writing data', err);
    });
  });

};

main();