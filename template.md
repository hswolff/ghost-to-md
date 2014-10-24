---
title: ${post.title}<% if (post.slug) { %>
slug: ${post.slug}<% } %><% if (post.tags.length) { %>
tags: ${post.tags.join(', ')}<% } %><% if (post.draft) { %>
draft: true<% } %>
---

${post.markdown}
