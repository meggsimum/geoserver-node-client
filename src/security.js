import fetch from 'node-fetch';
import { GeoServerResponseError } from './errors.js';

/**
 * Client for GeoServer security.
 *
 * @module SecurityClient
 */
export default class SecurityClient {
  /**
   * Creates a GeoServer REST SecurityClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} user The user for the GeoServer REST API
   * @param {String} password The password for the GeoServer REST API
   */
  constructor (url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;
  }

  /**
   * Returns all users registered in GeoServer.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with all users
   */
  async getAllUsers () {
    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'security/usergroup/users.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      throw new GeoServerResponseError();
    }
    return await response.json();
  }

  /**
   * Creates a new user.
   *
   * @param {String} username The name of the user to be created
   * @param {String} password The password of the user to be created
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If the user could be created
   */
  async createUser (username, password) {
    const body = {
      user: {
        userName: username,
        password: password,
        enabled: true
      }
    };

    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'security/usergroup/users.json', {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      switch (response.status) {
        case 404:
          throw Error(`User ${username} might already exists.`);
        default:
          throw new Error('Response not recognised')
      }
    }

    return true;
  }

  /**
   * Updates an existing user. User name is only taken for identification and
   * cannot be changed with this API call.
   *
   * @param {String} username The name of the user to be created
   * @param {String} password The password of the user to be created
   * @param {Boolean} enabled Enable / disable the user
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If user could be updated
   */
  async updateUser (username, password, enabled) {
    const body = {
      user: {
        password: password,
        enabled: enabled
      }
    };

    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'security/usergroup/user/' + username, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Provided username does not exist: ${username}`);
    }
    return true;
  }

  /**
   * Associates the given role to the user.
   *
   * @param {String} username The name of the user to add the role to
   * @param {String} role The role to associate
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If the role could be associated
   */
  async associateUserRole (username, role) {
    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(`${this.url}security/roles/role/${role}/user/${username}`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      throw new Error(`Provided role does not exist: ${role}`);
    }
    return true;
  }
}
