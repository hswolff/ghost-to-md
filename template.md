---
title: ${post.title}<% if (post.slug) { %>
slug: ${post.slug}<% } %>
date_published: ${post.publishedAt}
date_updated: ${post.updatedAt}<% if (post.tags.length) { %>
tags: ${post.tags.join(', ')}<% } %><% if (post.status === 'draft') { %>
draft: true<% } %><% if (post.custom_excerpt) { %>
excerpt: ${post.custom_excerpt}<% } %><% if (post.feature_image) { %>
feature_image: ${post.feature_image}<% } %>
---

# ${post.title}
<% if (post.feature_image) { %>
![](${post.feature_image})
<% } %>

# ${post.title}

${post.markdown}

---
Tags: <% if (post.tags.length) { 
  for (tag of post.tags) {
    %>[<%= tag %>](../../tags/<%= tag %>.md), <%
  }
}
%>  
date_published: ${post.publishedAt}  
date_updated: ${post.updatedAt}   