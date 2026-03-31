const Docker = require('dockerode');

// Sur Windows, utiliser le pipe nommé par défaut
// Sur Linux/Mac, utiliser /var/run/docker.sock
const defaultSocket = process.platform === 'win32'
    ? '//./pipe/docker_engine'
    : '/var/run/docker.sock';

const docker = new Docker({
    socketPath: process.env.DOCKER_SOCKET || defaultSocket
});

module.exports = docker;
