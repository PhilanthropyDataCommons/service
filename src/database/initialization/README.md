Any `.sql` files in this folder will be invoked on application startup.

These files are NOT migration files, but rather are files to initialize the database once per session.

Specifically, they can be edited over time.

## Load order

Files are created one at a time in filename order, so a numeric prefix controls when a file is created relative to the others — lower numbers first. Use a prefix where it is necessary: when a function written in `LANGUAGE sql` references another function defined here, give it a higher prefix than the functions it depends on so they already exist when it is created. Function body validation stays enabled, so a function created before something it references — a wrong prefix, or a circular reference — fails loudly at startup rather than on its first call.

Functions written in `LANGUAGE plpgsql` resolve their references when called rather than when created, so their order never matters.
