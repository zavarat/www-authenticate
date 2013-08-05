
'use strict';
require('should');
var www_authenticate = require('..')
  , parsers = www_authenticate.parsers;
  ;

var CNONCE='0a4f113b'

describe( 'www-authenticate', function() {
  describe( 'www_authenticate()', function() {
    it( 'should be a function', function() {
      www_authenticate.should.be.a( 'function' );
    } );
    it( 'should return a function', function() {
      www_authenticate()
    } );
    it( 'should authenticate rfc1945 example', function(done) {
      var on_www_authenticate= www_authenticate("Aladdin","open sesame")
      //...receive HTTP/1.1 401 Unauthorized
      // parse header['www-authenticate']:
      var authenticator= on_www_authenticate('Basic realm="sample"');
      if (authenticator.err) throw err;
      // now, whenever you need to create an Authorization header:
      authenticator.authorize("GET","/dir/index.html").should.equal(
            'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
      );
      done();
    } );
    it( 'should authenticate rfc1945 example even without method and path (they do not matter)', function(done) {
      var on_www_authenticate= www_authenticate("Aladdin","open sesame")
      //...receive HTTP/1.1 401 Unauthorized
      // parse header['www-authenticate']:
      var authenticator= on_www_authenticate('Basic realm="sample"');
      if (authenticator.err) throw err;
      // now, whenever you need to create an Authorization header:
      authenticator.authorize().should.equal(
            'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
      );
      done();
    } );
    it( 'should be capable of doing Basic authentication without any password', function(done) {
      var on_www_authenticate= www_authenticate("Aladdin")
      //...receive HTTP/1.1 401 Unauthorized
      // parse header['www-authenticate']:
      var authenticator= on_www_authenticate('Basic realm="sample"');
      if (authenticator.err) throw err;
      // now, whenever you need to create an Authorization header:
      authenticator.authorize().should.equal(
            'Basic ' + new Buffer('Aladdin').toString('base64')
      );
      done();
    } );
    it( 'should handle a blank password differently than a non-existant one', function(done) {
      var on_www_authenticate= www_authenticate("Aladdin", "")
      //...receive HTTP/1.1 401 Unauthorized
      // parse header['www-authenticate']:
      var authenticator= on_www_authenticate('Basic realm="sample"');
      if (authenticator.err) throw err;
      // now, whenever you need to create an Authorization header:
      authenticator.authorize().should.equal(
            'Basic ' + new Buffer('Aladdin:').toString('base64')
      );
      done();
    } );
    it( 'should authenticate rfc2617 example', function(done) {
      var on_www_authenticate= www_authenticate("Mufasa","Circle Of Life",{cnonce:CNONCE})
      //...receive HTTP/1.1 401 Unauthorized
      // parse header['www-authenticate']:
      var authenticator= on_www_authenticate('Digest '+
                 'realm="testrealm@host.com", '+
                 'qop="auth,auth-int", '+
                 'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", '+
                 'opaque="5ccc069c403ebaf9f0171e9517f40e41"'
      )
      if (authenticator.err) throw err;
      // now, whenever you need to create an Authorization header:
      authenticator.authorize("GET","/dir/index.html").should.equal(
            'Digest username="Mufasa", '+
            'realm="testrealm@host.com", '+
            'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", '+
            'uri="/dir/index.html", '+
            'qop=auth, '+
            'nc=00000001, '+
            'cnonce="'+CNONCE+'", '+
            'response="6629fae49393a05397450978507c4ef1", '+
            'opaque="5ccc069c403ebaf9f0171e9517f40e41"'
      );
      done();
    } );
    it( 'should allow a blank cnonce to be specified', function(done) {
      var on_www_authenticate= www_authenticate("Mufasa","Circle Of Life",{cnonce:''})
      //...receive HTTP/1.1 401 Unauthorized
      // parse header['www-authenticate']:
      var authenticator= on_www_authenticate('Digest '+
                 'realm="testrealm@host.com", '+
                 'qop="auth,auth-int", '+
                 'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", '+
                 'opaque="5ccc069c403ebaf9f0171e9517f40e41"'
      )
      if (authenticator.err) throw err;
      // now, whenever you need to create an Authorization header:
      authenticator.authorize("GET","/dir/index.html").should.equal(
            'Digest username="Mufasa", '+
            'realm="testrealm@host.com", '+
            'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", '+
            'uri="/dir/index.html", '+
            'qop=auth, '+
            'nc=00000001, '+
            'cnonce="", '+
            'response="feee16a35faef0a0371c7210e4bdb6a5", '+
            'opaque="5ccc069c403ebaf9f0171e9517f40e41"'
      );
      done();
    } );
    it( 'should generate a hexadecimal cnonce if one is not specified', function(done) {
      var on_www_authenticate= www_authenticate("Mufasa","Circle Of Life")
      //...receive HTTP/1.1 401 Unauthorized
      // parse header['www-authenticate']:
      var authenticator= on_www_authenticate('Digest '+
                 'realm="testrealm@host.com", '+
                 'qop="auth,auth-int", '+
                 'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", '+
                 'opaque="5ccc069c403ebaf9f0171e9517f40e41"'
      )
      if (authenticator.err) throw err;
      // now, whenever you need to create an Authorization header:
      authenticator.authorize("GET","/dir/index.html").search(/cnonce="[0-9a-f]+"/).should.not.equal('-1');
      done();
    } );
    it( 'should increment nonce-count', function(done) {
      var on_www_authenticate= www_authenticate("Mufasa","Circle Of Life",{cnonce:CNONCE})
      var authenticator= on_www_authenticate('Digest '+
                 'realm="testrealm@host.com", '+
                 'qop="auth,auth-int", '+
                 'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", '+
                 'opaque="5ccc069c403ebaf9f0171e9517f40e41"'
      );
      authenticator.authorize("GET","/dir/index.html");
      authenticator.authorize("GET","/dir/index.html").should.include('nc=00000002');
      done();
    } );
    it( 'should parse an Authentication_Info header', function(done) {
      var parsed= new parsers.Authentication_Info(
                 'nextnonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", '+
                 'qop="auth,auth-int", '+
                 'rspauth="6629fae49393a05397450978507c4ef1", '+
                 'nc=00000001, '+
                 'cnonce="abc""def"'
              );
      parsed.should.not.have.property('err');
      var parms= parsed.parms;
      parms.should.have.property('nextnonce','dcd98b7102dd2f0e8b11d0f600bfb0c093');
      parms['nextnonce'].should.equal('dcd98b7102dd2f0e8b11d0f600bfb0c093');
      parms['qop'].should.equal('auth,auth-int');
      parms['rspauth'].should.equal('6629fae49393a05397450978507c4ef1');
      parms['nc'].should.equal('00000001');
      parms['cnonce'].should.equal('abc"def');  // double double quote properly parsed as single double quote
      done();
    } );
    it( 'should correctly parse a quoted string that includes a comma', function(done) {
      var parsed= new parsers.Authentication_Info(
                 'nextnonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", '+
                 'qop="auth,auth-int", '+
                 'rspauth="6629fae49393a05397450978507c4ef1", '+
                 'nc=00000001, '+
                 'cnonce="abc""d,ef"'
              );
      parsed.should.not.have.property('err');
      var parms= parsed.parms;
      parms.should.have.property('nextnonce','dcd98b7102dd2f0e8b11d0f600bfb0c093');
      parms['nextnonce'].should.equal('dcd98b7102dd2f0e8b11d0f600bfb0c093');
      parms['qop'].should.equal('auth,auth-int');
      parms['rspauth'].should.equal('6629fae49393a05397450978507c4ef1');
      parms['nc'].should.equal('00000001');
      parms['cnonce'].should.equal('abc"d,ef');  // double double quote properly parsed as single double quote
      done();
    } );
  } );
} );
