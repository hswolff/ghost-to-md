#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var argv = require('yargs');
var h2m = require('h2m');
var htmlparser2 = require("htmlparser2");
const bent = require('bent')

argv = argv
  .usage('Migrate your Ghost database to markdown files.')
  .example('$0 ghost-export.json', 'Migrates export file.')
  .options('o', {
    describe: 'Output directory.',
    alias: 'output',
    default: 'ghost-to-md-output'
  })
  .options('p', {
    describe: 'Template Post File.',
    alias: 'template'
  })
  .options('t', {
    describe: 'Template Tag File.',
    alias: 'templatetag'
  })
  .options('i', {
    describe: 'Download External Images (Eventually base website "https://www.example.com")',
    alias: 'downloadimages',
    default: false
  })/*
  .options('d',{
    describe: "Include Drafts",
    alias: 'drafts',
    default: false
  })*/
  .options('f',{
    describe: 'Subfolder Grouping Logic. (not yet)',
    alias: 'subfolder',
    default: false
  })
  .options('s', {
    describe: 'Sidecar Files. (not yet)',
    alias: 'sidecar',
    default: false
  })
  .demand(1).argv;



function checkRelativeSrc(imgSrc) {
  if (imgSrc[0] == "/") {
    return argv.downloadimages + imgSrc;
  }
  return imgSrc;
}

async function downloadImage(inUrl, outFilePath) {
  const getBuffer = bent('buffer');
  inUrl = checkRelativeSrc(inUrl);
  if (!fs.existsSync(outFilePath)) 
  {
    try {
      let buffer = await getBuffer(inUrl);
      fs.writeFileSync(outFilePath, buffer);
    } catch (e) {
      console.log(["Can't download",inUrl, outFilePath,"maybe unpublished post"]);
      // console.log(inUrl);
      fs.writeFileSync(outFilePath+".txt",inUrl);
    }
  }
}


/**
 * Try to read the directory, create it if it doesn't exist.
 * @param {String} path 
 */
function readOrMkDir(path) {
  try {
    fs.readdirSync(path);
  } catch (e) {
    fs.mkdirSync(path,{recursive: true});
  }
}

// Get full path to output directory
var outputDirectoryPath = path.resolve(argv.output);

// Try to read the output directory, create it if it doesn't exist.
readOrMkDir(outputDirectoryPath);

// Try to read the export file from the file system and parse it as JSON data.
try {
  var data = JSON.parse(
    fs.readFileSync(path.resolve(argv._[0]), { encoding: 'utf8' })
  );
} catch (e) {
  console.error('Could not parse export file:', e.path);
  return 0;
}

/**
 * The path to the template file.  If it's given as an argument than its
 * relative to where the script is being ran from, otherwise we take it
 * from this script's location.
 * @type {string}
 */
var templatePath = argv.template
  ? path.resolve(argv.template)
  : path.resolve(__dirname, 'template.md');

var templateTagPath = argv.templatetag
  ? path.resolve(argv.templatetag)
  : path.resolve(__dirname, 'templatetag.md');

/**
 * Read in template string.
 * @type {string}
 */
var templateStr = fs.readFileSync(templatePath, { encoding: 'utf8' });
var templateTagStr = fs.readFileSync(templateTagPath, { encoding: 'utf8' });

/**
 * Precompile post template.
 * @type {Function}
 */
var postTemplate = _.template(templateStr);
var tagTemplate = _.template(templateTagStr);

/**
 * Extracts all URLs from a HTML string
 */
function extractImgUrls(htmlString) {
  var urls = [];
  const parser = new htmlparser2.Parser({
    onopentag(name, attribs) {
        if (name === "img") {
            urls.push(attribs.src);
        }
      }
  });
  parser.write(htmlString);
  parser.end();
  return urls
}

function imgFileName(url) {
  return url.split('/').pop().split('?').shift()
}

/**
 * Converts an array to a map.
 * @param  {Array} array  Array object we're transforming.
 * @param  {string} mapKey The property we're using to get the key for the
 *  dictionary.
 * @return {Object} The transformed array.
 */
function arrayToMap(array, mapKey) {
  var mapObj = {};
  mapKey = mapKey || 'id';
  array.forEach(function(item) {
    mapObj[item[mapKey]] = item;
  });
  return mapObj;
}

/**
 * Given a time string or integer value we will format it into a human readable
 * string.
 * @param  {string|number} timeStr A time value, in the form of '1406827588763'.
 * @return {string}  Human readable string, such as '2014-10-08'.
 */
function formatDate(timeStr) {
  function ensure0Padding(val) {
    return val < 10 ? '0' + val : val;
  }

  var publishedDate = new Date(timeStr);

  var date = [
    publishedDate.getFullYear(),
    ensure0Padding(publishedDate.getMonth() + 1),
    ensure0Padding(publishedDate.getDate())
  ];

  return date.join('-');
}

/**
 { id: 1,
   uuid: '496e4476-6345-4b64-9779-7166cd957070',
   key: 'databaseVersion',
   value: '003',
   type: 'core',
   created_at: 1388436339288,
   created_by: 1,
   updated_at: 1388436339288,
   updated_by: 1 }
 */
var settings = data.db[0].data.settings;

/**
 { id: 2, post_id: 3, tag_id: 360 }
 */
var postsTags = {};
data.db[0].data.posts_tags.forEach(function(item) {
  postsTags[item.post_id] = postsTags[item.post_id] || [];
  postsTags[item.post_id].push(item.tag_id);
});

/**
 { id: 1,
   uuid: '920afa0b-f8f1-4d55-a75d-e0470bfd300c',
   name: 'Getting Started',
   slug: 'getting-started',
   description: null,
   parent_id: null,
   meta_title: null,
   meta_description: null,
   created_at: 1388436339245,
   created_by: 1,
   updated_at: 1388436339245,
   updated_by: 1,
   image: null,
   hidden: 0 }
 */
var tags = arrayToMap(data.db[0].data.tags);
for (index in tags) {
  tags[index]["pages"] = [];
}


/**
id
uuid
title
slug
mobiledoc
html
comment_id
plaintext
feature_image
featured
type
status
locale
visibility
send_email_when_published
author_id
created_at
updated_at
published_at
custom_excerpt
codeinjection_head
codeinjection_foot
custom_template
canonical_url

 { id: 2,
  uuid: '6a583a87-7f37-4b51-976a-cd6b5b809d56',
  title: 'Hello world!',
  slug: 'hello-world',
  markdown: 'This is your first post.',
  html: '<p>This is your first post.</p>',
  image: null,
  featured: 0,
  page: 0,
  status: 'published',
  language: 'en_US',
  meta_title: null,
  meta_description: null,
  author_id: 1,
  created_at: 1263372815000,
  created_by: 1,
  updated_at: 1263372815000,
  updated_by: 1,
  published_at: 1263372815000,
  published_by: 1 }
 */
data.db[0].data.posts.forEach(function(post) {
  // Format the file name we're going to save.
  // Will be in the form of '2014-10-11-post-slug.md';
  // var fileName = post.formattedDate + '-' + post.slug + '.md';
  // for (i in post) console.log(i);
  //console.log([post.slug,post.visibility]);
  //if (!post.visibility && !argv.drafts) return; // don't process drafts unless asked
  var basename = (post.visibility) ? "": "drafts/";  
  basename += (post.type) + "/";
  basename += post.slug;
  var fileName = basename + "/index.md";

  var postTags = postsTags[post.id] || [];
  post.tags = [];

  // Add each tag to the post.
  postTags.forEach(function(tagId) {
    var tag = tags[tagId];
    if (tag) {
      post.tags.push(tag.slug);
      tags[tagId]["pages"].push(basename);
    }
  });

  post.title =
    post.title.indexOf(':') > 1 ? '"' + post.title + '"' : post.title;

  // Convert to ISO string.
  post.publishedAt = new Date(post.published_at).toISOString();
  post.updatedAt = new Date(post.updated_at).toISOString();

  post.formattedDate = formatDate(post.published_at);


  // var foldername = (post.tags && post.tags[0])?post.tags[0].slug :"";



  // If this entry is a page then rename the file name.
  // if (post.page) {
    // fileName = 'page-' + post.slug + '.md';
  //}

  // Try to read the output directory, create it if it doesn't exist.
  var imgUrls = extractImgUrls(post.html);
  var outFolderPath =  outputDirectoryPath + "/" + basename + "/";
  var outFolderImagesRelativePath = "images/";
  var outFolderImagesPath = outFolderPath + outFolderImagesRelativePath;
  readOrMkDir(outFolderPath);
  if (argv.downloadimages) {
    readOrMkDir(outFolderImagesPath);
    if(post.feature_image) {
      imgUrls.push(post.feature_image);
      post.feature_image = "./" + outFolderImagesRelativePath + imgFileName(post.feature_image);
    }
    for(let i in imgUrls) {
      var inUrl = imgUrls[i];
      var outFilePath = outFolderImagesPath + imgFileName(inUrl);
      if (post.html) {
        post.html = post.html.replace(inUrl,outFilePath);
      }
      downloadImage(inUrl,outFilePath);
      /*
      const getBuffer = bent('buffer');
      if (!fs.existsSync(outFilePath)) 
      {
        try {
          let buffer = await getBuffer(inUrl);
          fs.writeFileSync(outFilePath, buffer);
        } catch (e) {
          console.log(["Can't download",inUrl, post.slug,"maybe unpublished post"]);
          fs.writeFileSync(outFilePath+".txt",inUrl);
        }
      }
      */

    }
  }
  
  // Currently the ghost export file does not include markdown
  post.markdown = h2m(post.html);
  // File content.
  var fileContent = postTemplate({
    post: post
  });

  // Get full path to the file we're going to write.
  var filePath = path.resolve(outputDirectoryPath, fileName);

  // Write file.
  fs.writeFileSync(filePath, fileContent, { encoding: 'utf8' });
});

readOrMkDir(path.resolve(outputDirectoryPath, "tags"));

data.db[0].data.tags.forEach(async function(tag) {
  var baseRelDir = "tags/";
  var baseFilename = tag["slug"];
  // var fileName = basename + ".md";
  // Get full path to the file we're going to write.
  // var filePath = path.resolve(outputDirectoryPath, fileName);
  // readOrMkDir(filePath);
  if (tag["feature_image"]) {
    var imgOutFilename = baseFilename + "." + imgFileName(tag["feature_image"]).split(".").pop(); 
    var imgOutPath = outputDirectoryPath + "/" + baseRelDir + imgOutFilename;
    var imgInPath = tag["feature_image"];
    if (imgInPath[0] == "/") {
      imgInPath = "https://en.mann.fr" + imgInPath;
    }
    const getBuffer = bent('buffer');
    if (!fs.existsSync(imgOutPath)) 
    {
      try {
        let buffer = await getBuffer(imgInPath);
        fs.writeFileSync(imgOutPath, buffer);
      } catch (e) {
        console.log(["Can't download",imgInPath, post.slug,"maybe unpublished tag"]);
        fs.writeFileSync(imgOutPath+".txt",imgInPath);
      }
    }
    tag["feature_image"] = "./" + imgOutFilename;
  }
    // File content.
    var fileContent = "Not Quite";
    try {
      fileContent = tagTemplate({
        tag: tag
      });
    } catch (e) {
      console.log(tag);
      fileContent = "Not Quite";
    }
  fs.writeFileSync(outputDirectoryPath + "/" + baseRelDir + baseFilename + ".md", fileContent, { encoding: 'utf8' });
});