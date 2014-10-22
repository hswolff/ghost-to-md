---
title: ${post.title}<% if (post.tags.length) { %>
tags: ${post.tags.join(', ')}<% } %><% if (post.draft) { %>
draft: true<% } %>
---

${post.markdown}
