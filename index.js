var fs = require('fs');
var path = require('path');
var _ = require('lodash');

/**
 * Where we should output the built files.
 * @type {string}
 * @const
 */
var outputDirectory = 'output';

// Get full path to output directory
var outputDirectoryPath = path.resolve(__dirname, outputDirectory);

// Try to read the output directory, create it if it doesn't exist.
try {
  fs.readdirSync(outputDirectoryPath);
} catch (e) {
  fs.mkdirSync(outputDirectoryPath);
}

/**
 * File name of this file so we can exclude it when finding the export file.
 * Should return a string of just the file name.
 * Such as 'index.js'.
 * @type {string}
 */
var thisFileName = __filename.replace(__dirname + '/', '');

/**
 * Find the export file name.  This assumes it's the only other file in the
 * directory.
 * @type {string} Should be something like 'my-blog.ghost.2014-10-22.json'.
 */
var exportFile = fs.readdirSync(__dirname).filter(function(name) {
  return name !== thisFileName && name.indexOf('json') > 1;
})[0];

/**
 * The process argument value.
 * @type {String}
 * @const
 */
var fileArg = '--file';

// Find the file name of the export file from passed in arguments.
process.argv.forEach(function(arg) {
  if (arg.indexOf(fileArg) > -1) {
    exportFile = arg.split('=')[1];
  }
});

// Try to read the export file from the file system and parse it as JSON data.
try {
  var data = JSON.parse(fs.readFileSync(path.resolve(exportFile), {encoding: 'utf8'}));
} catch (e) {
  console.error('Could not parse export file:', e.path);
  return 0;
}

/**
 * Read in template string.
 * @type {string}
 */
var templateStr = fs.readFileSync('template.md', {encoding: 'utf8'});

/**
 * Precompile post template.
 * @type {Function}
 */
var postTemplate = _.template(templateStr);

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
    return String(val).length === 1 ? '0' + val : val;
  }

  var publishedDate = new Date(timeStr);

  var parts = [
    publishedDate.getFullYear(),
    ensure0Padding(publishedDate.getMonth() + 1),
    ensure0Padding(publishedDate.getDate())
  ];

  return parts.join('-');
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

/**
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
  var postTags = postsTags[post.id] || [];
  post.tags = [];

  // Add each tag to the post.
  postTags.forEach(function(tagId) {
    var tag = tags[tagId];
    if (tag) {
      post.tags.push(tag.name);
    }
  });

  post.formattedDate = formatDate(post.published_at);

  // Format the file name we're going to save.
  // Will be in the form of '2014-10-11-post-slug.md';
  var fileName = post.formattedDate + '-' + post.slug + '.md';

  // If this entry is a page then rename the file name.
  if (post.page) {
    fileName = 'page-' + post.slug + '.md';
  }

  // File content.
  var fileContent = postTemplate({
    post: post
  });

  // Get full path to the file we're going to write.
  var filePath = path.resolve(outputDirectory, fileName);

  // Write file.
  fs.writeFileSync(filePath, fileContent, {encoding: 'utf8'});
});
