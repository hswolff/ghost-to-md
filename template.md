---
title: ${post.title}<% if (post.slug) { %>
slug: ${post.slug}<% } %>
date_published: ${post.publishedAt}
date_updated: ${post.updatedAt}<% if (post.tags.length) { %>
tags: ${post.tags.join(', ')}<% } %><% if (post.status === 'draft') { %>
draft: true<% } %><% if (post.custom_excerpt) { %>
excerpt: ${post.custom_excerpt}<% } %>
---

${post.markdown}
