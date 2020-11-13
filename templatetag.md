---
title: ${tag.name}<% if (tag.slug) { %>
slug: ${tag.slug}<% } %><% if (tag.feature_image) { %>
image: ${tag.feature_image}<% } %>
---

# ${tag.name}
<% if (tag.feature_image) { %>
![](${tag.feature_image})
<% } %>

${tag.description}

Pages: 

<% tag.pages.forEach(function(page){ %>
* [<%= page %>](../<%= page %>.md)
<% }); %>