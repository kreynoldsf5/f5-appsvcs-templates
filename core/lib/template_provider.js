'use strict';

const fs = require('fs');

const TemplateEngine = require('./template_engine.js').TemplateEngine;

const ioUtil = require('./io_util.js');

const ResourceCache = ioUtil.ResourceCache;
const makeRequest = ioUtil.makeRequest;

const FsSchemaProvider = require('./schema_provider.js').FsSchemaProvider;

function FsTemplateProvider(templateRootPath, schemaRootPath) {
    this.config_template_path = templateRootPath;
    this.config_schema_path = schemaRootPath;
    this.schema_provider = new FsSchemaProvider(schemaRootPath);

    this.cache = new ResourceCache(templateName => new Promise((resolve, reject) => {
        fs.readFile(`${templateRootPath}/${templateName}.mst`, (err, data) => {
            if (err) reject(err);
            else {
                resolve(data.toString('utf8'));
            }
        });
    }).then((data) => {
        if (!this.schemaSet) {
            return this.schema_provider.schemaSet()
                .then((schemas) => {
                    this.schemaSet = schemas;
                    return new TemplateEngine(templateName, data, this.schemaSet);
                });
        }
        return new TemplateEngine(templateName, data, this.schemaSet);
    }));

    return this;
}

FsTemplateProvider.prototype.fetch = function fetch(key) {
    return this.cache.fetch(key);
};

// used for listing AS3 templates available
FsTemplateProvider.prototype.list = function list() {
    return new Promise((resolve, reject) => {
        fs.readdir(this.config_template_path, (err, data) => {
            if (err) reject(err);

            const templateList = data.filter(x => x.endsWith('.mst'))
                .map(x => x.split('.')[0]);
            resolve(templateList);
        });
    });
};

function GitHubTemplateProvider(githubRepoPath) {
    this.githubRepoPath = githubRepoPath;

    this.list_opts = {
        host: 'api.github.com',
        path: `/repos/${githubRepoPath}/contents/templates/simple`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        }
    };

    this.fetch_opts = {
        host: 'raw.githubusercontent.com',
        path: 'path/to/directory/contents',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        }
    };

    this.cache = new ResourceCache((templateName) => {
        this.fetch_opts.path = `/${this.githubRepoPath}/master/templates/simple/${templateName}.mst`;
        return makeRequest(this.fetch_opts).then(result => result.body);
    });

    return this;
}

GitHubTemplateProvider.prototype.fetch = function fetch(templateName) {
    return this.cache.fetch(templateName);
};

GitHubTemplateProvider.prototype.list = function list() {
    return makeRequest(this.list_opts).then((result) => {
        if (result.status === '404') {
            throw new Error(`Repository not found: ${this.githubRepoPath}`);
        }
        return JSON.parse(result.body)
            .map(fileMeta => fileMeta.name.split('.')[0]);
    });
};

function PostmanTemplateProvider(postmanCollection) {
    this.collection = postmanCollection;
    return this;
}

module.exports = {
    FsTemplateProvider,
    GitHubTemplateProvider,
    PostmanTemplateProvider
};