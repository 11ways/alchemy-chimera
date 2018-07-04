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