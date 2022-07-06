## 1.0.6 (WIP)

## 1.0.5 (2022-07-06)

* Fix page title containing 'undefined'
* Update styles
* Add support for "private" document fields

## 1.0.4 (2022-05-31)

* Add delete page

## 1.0.3 (2022-03-16)

* Make table filtering case insensitive

## 1.0.2 (2022-02-20)

* Improve editor styling
* Put editor errors in the Widget context
* Add TOC to editor
* Make sidebar sticky

## 1.0.1 (2022-01-28)

* Allow setting a simple menu sidebar in the config
* Add simple notification after adding/saving
* Add page & window titles
* Improve edit buttons

## 1.0.0 (2021-09-12)

* Use widgets to create the interface
* Release preview version of 1.0.0

## 0.6.0 (2020-07-21)

* Make compatible with Alchemy v1.1.0
* If no field title is found, use the name instead
* Fix "empty" still showing html content on client renders
* Use `display_field_select` model property when querying for related data
* Also use `display_field_select` when querying for the actionValue
* Do not html-encode string input values, hawkejs will do that
* Use `display_field_select` property when editing a record & in habtm requests
* Fix client-side renders of schema fields
* If a change is made to a translatable field, send it entirely to the server, not just the changed prefix
* Use ckeditor 4.13 from now on + fix pasting styled text
* Go back to index page when clicking on save&close and nothing has changed
* The chimera editor now queries the document before saving, this fixed subschema saves
* Add checkbox toggle-switch stylings + some small ui fixes
* Use Tail datetime picker
* Use `export` field group for exports + use formatted action values
* Get model title from the `title` property of the class
* Allow setting a default page size in the plugin config or on the model
* Make sure to translate `BelongsTo#actionValue()` responses

## 0.5.3 (2018-12-06)

* Allow using classic (iframe) mode in ckeditor Text field
* Allow adding custom CSS files to the classic ckeditor mode
* Add Html field
* Add field title & description support

## 0.5.2 (2018-10-18)

* `HABTMChimeraField#sendRelatedData` will now query all fields, so property getters will work
* Make CKEditor leave div classnames alone

## 0.5.1 (2018-08-27)

* `sendRelatedData` now uses `DocumentList#toSimpleArray()`, so this way property getters can act as a displayField
* Add support for reordering records in a listing
* Don't show prefix buttons when there is only 1 prefix
* Fix view action
* Add for/id attributes to inputs & labels
* Remove certain buttons from ckeditor
* Add "save & close" record action
* Don't add id parameter to action links of none is required
* Use time-ago element for date fields in the list view

## 0.5.0 (2018-07-04)

* Compatible with alchemy v1.0.0

## 0.4.1 (2017-10-03)

* Fix handling fields that are an array of arrays
* Add option to hide translation buttons
* Add option to set the notification timeout
* The `Command` class is now `Task`

## 0.4.0 (2017-08-27)

* Linked subschema's will now change on-the-fly in the editor, without saving
* Fix saving non-array subschema fields
* Fix BelongsTo fields in Chimera frontend using the assoc_id entry wrong
* Fix: schema fields linked to a field in the root will now also update
* Use regular date inputs for date, time and datetime values
* Improve prefix buttons
* Cleanup listing and edit code (new variables) and fix create/save redirect
* Fix getting related data from subschemas
* Fix showing nested subschema newvalue fields
* Enum fields now also have a 'remove-entry' button when arrayable
* Fixed vex issue

## 0.3.0

* Fields are, again, rendered using Hawkejs

## 0.2.0 (2016-05-26)

* Reworked for alchemy 0.2.0