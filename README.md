# toybird

Toybird is supposed to be a scriptable IMAP server for client testing.

**NB** To see a working version, see the master branch. This is a rewrite of the original project to allow better extendability. New IMAP parser was added etc.

## Scope

Toybird is a single user / multiple connections IMAP server that uses a JSON object as its directory and messages structure. Nothing is read from or written to disk and the entire directory structure is instantiated every time the server is started, eg. changes made through the IMAP protocol (adding/removing messages/flags etc) are not saved permanently. This should ensure that you can write unit tests for clients in a way where a new fresh server with unmodified data is started for every test.

Several clients can connect to the server simultanously but all the clients share the same user account, even if login credentials are different.

# Known issues

These issues are probably not going to be fixed

  * **addr-adl** (at-domain-list) values are not supported, NIL is always used

# License

**MIT**