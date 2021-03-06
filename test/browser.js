"use strict";

const express = require('express');
const expect = require('chai').expect;
const Browser = require('puppeteer');

let browser = null;
let page = null;

const PORT = 3333;
const PARSE_TIMEOUT = 1000;

describe('Browser', function() {
  before(done => {
    let app = express();
    app.use(express.static(__dirname));
    app.use('/dist', express.static(__dirname + '/../dist'));
    app.listen(PORT, err => {
      if (err) return done(err);
      Browser.launch({args: ['--no-sandbox']})
        .then(b => browser = b)
        .then(_ => browser.newPage())
        .then(p => {
          page = p;
          return page.goto('http://localhost:3333/index.html');
        })
        .then(_ => done())
        .catch(e => done(e));
    });
  })

  after(() => browser.close());

  it('should have window.RSSParser', () => {
    return page.evaluate(() => {
      return typeof window.RSSParser;
    }).then(type => {
      expect(type).to.equal('object');
    })
  });

  it('should parse reddit', function() {
    this.timeout(PARSE_TIMEOUT + 1000);
    return page.evaluate(() => {
      RSSParser.parseURL('http://localhost:3333/input/reddit.rss', function(err, data) {
        window.error = err;
        window.reddit = data;
      })
    })
    .then(_ => {
      return new Promise(resolve => setTimeout(resolve, PARSE_TIMEOUT))
    })
    .then(_ => page.evaluate(() => {
      return window.error;
    }))
    .then(err => {
      expect(err).to.equal(null);
    })
    .then(_ => page.evaluate(() => {
      return window.reddit.feed.title;
    }))
    .then(title => {
      expect(title).to.equal('reddit: the front page of the internet');
    })
  })
})
