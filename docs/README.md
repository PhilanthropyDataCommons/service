---
nopublish: true
---

# API Documentation

## Auto-publishing

Markdown files in this `docs` directory are auto-published on commit
to the PDC WordPress site at https://philanthropydatacommons.org. The
path for each post is `[pdc.org]/slugified-filename`, and relative
links to other Markdown files in this repo will be changed to use the
correct URL before publishing.

### Exempt a file from auto-publishing

In order to prevent a file from auto-publishing, you can add set
`nopublish` to `true` in the frontmatter of your Markdown file, as in
this file.

### Add a file from outside directory

This is already done for the changelog which lives on the top level by
convention. Not sure if there are any other cases that will want this,
but the ability exists.

In order to add a file from outside `docs`, you will need to modify
the `publish_docs.yml` GitHub workflow.

1. Add the filepath to the on push paths, so that the file commmit
   triggers the publish action.
2. Add the filepath to the `extra_files` input under the `Publish to
   WordPress` step, so that the file is collected for publishing.

## Renaming files

The publishing action references post slugs in order to keep GH files
and WP posts in sync. The post slugs themselves are derived from the
source filename. As such, if you rename a previously published file on
`main`, please set up a forwarding link at the old filename, either
indefinitely or in coordination with someone on the WP side (that
might also be you) until such time that any links on the WP site can
be updated.

Only the filename itself matters for the slug, so the `docs` directory
can be restructured freely so long as filenames stay consistent.

## Metadata

We would like to keep documentation in sync with active development
without needing developers to know anything about what is happening on
WordPress, and the organization of the posts therein. As such we rely
on the natural structure of the documentation within the GH repository
as the basis of naming and categorizing documentation.

Any additional elaboration of this basic structure can be done on the
WordPress side, though a few options are provided the GH side to
modify what gets posted to WordPress.

### Directory structure

Documentation is initially categorized based on filepath in
the docs repo, including the `docs` base folder. So a file in
`docs/onboarding/idp/` will get filed under the `docs`, `onboarding`,
and `idp` post categories in WordPress. Even files added from outside
the base directory will get the `docs` category, because we assume
they contain documentation of some kind despite their anomalous
location.

If the category does not yet exist, the GitHub action will create it,
mirroring directory structure with respect to parent and child
categories, such that `idp` will be a child category of `onboarding`,
and so on. If you would like the name and slug of the category to
differ (for example, slug is `docs` but category name is
"Documentation"), this can be managed on the WordPress side.

Any additional metadata, including tags and categories that are
modified or added on the WordPress side will be managed and preserved
there.

### File frontmatter

To a limited extent, files can contain [frontmatter](https://github.com/jonschlinkert/gray-matter#what-does-this-do) that
overrides or supplements metadata for the WordPress post, including:

#### `title`

- Overrides default title derived from filename
- Not displayed on WordPress post, but stored as post title
- The top-level heading `#` of the main content is what gets displayed
  at the top of each post

REMOVE #### `slug`

### `excerpt`

WordPress will use this as the post excerpt instead of just grabbing
the first few lines of the post as the excerpt.

### `status`

- What status to set when posting to WordPress:
  * `draft`   (create a draft post)
	* `publish` (publish publicly immediately)
	* `private` (only visible to WP admin)

REMOVE
### `categories`

WordPress categories are currently determined by directory structure
(see below), and managed on the WordPress side. This attribute allows
you to add *additional* categories on the GitHub side, should that
be desirable. While the GH action will create a category for you if it
does not exist, it's nicer to add it on the WordPress side first so
you can make sure it looks the way you want upon publish.
Not sure that we need this either actually.

### `nopublish`

Not related to WordPress metadata. When set to true, it prevents a
file from being sent to WordPress at all. See the top of this document
for example.
