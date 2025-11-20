import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';

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
   * @param {String} auth The Basic Authentication string
   */
  constructor(url, auth) {
    this.url = url;
    this.auth = auth;
  }

  /**
   * Returns all users registered in GeoServer.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with all users
   */
  async getAllUsers() {
    const response = await fetch(this.url + 'security/usergroup/users.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return response.json();
  }

  /**
   * Creates a new user.
   *
   * @param {String} username The name of the user to be created
   * @param {String} password The password of the user to be created
   *
   * @throws Error if request fails
   */
  async createUser(username, password) {
    const body = {
      user: {
        userName: username,
        password: password,
        enabled: true
      }
    };

    const response = await fetch(this.url + 'security/usergroup/users.json', {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      switch (response.status) {
        case 404:
          throw new GeoServerResponseError(
            `User ${username} might already exists.`,
            geoServerResponse
          );
        default:
          throw new GeoServerResponseError(null, geoServerResponse);
      }
    }
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
   */
  async updateUser(username, password, enabled) {
    const body = {
      user: {
        password: password,
        enabled: enabled
      }
    };

    const response = await fetch(this.url + 'security/usergroup/user/' + username, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Deletes an existing user.
   *
   * @param {String} username The name of the user to be deleted
   *
   * @throws Error if request fails
   */
  async deleteUser(username) {
    const response = await fetch(this.url + 'security/usergroup/user/' + username, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Returns all roles registered in GeoServer.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with all roles like { "roles": ["ADMIN", "GROUP_ADMIN"] }
   */
  async getAllRoles() {
    const url = `${this.url}security/roles.json`;

    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return response.json();
  }

  /**
   * Creates a new role.
   *
   * @param {String} role The name of the role to be created
   *
   * @throws Error if request fails
   */
  async createRole(role) {
    const url = `${this.url}security/roles/role/${role}`;

    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      switch (response.status) {
        case 404:
          throw new GeoServerResponseError(`Role ${role} might already exist.`, geoServerResponse);
        default:
          throw new GeoServerResponseError(null, geoServerResponse);
      }
    }
  }

  /**
   * Deletes an existing role.
   *
   * @param {String} role The name of the role to be deleted
   *
   * @throws Error if request fails
   */
  async deleteRole(role) {
    const url = `${this.url}security/roles/role/${role}`;

    const response = await fetch(url, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      switch (response.status) {
        case 404:
          throw new GeoServerResponseError(`Role ${role} not existing.`, geoServerResponse);
        default:
          throw new GeoServerResponseError(null, geoServerResponse);
      }
    }
  }

  /**
   * Associates the given role to the user.
   *
   * @param {String} username The name of the user to add the role to
   * @param {String} role The role to associate
   *
   * @throws Error if request fails
   */
  async associateUserRole(username, role) {
    const response = await fetch(`${this.url}security/roles/role/${role}/user/${username}`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }
}
