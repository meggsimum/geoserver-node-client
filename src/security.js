import fetch from 'node-fetch';

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

  // TODO: I could not get it working, got Code '406'
  /**
   * Returns all users registered in GeoServer.
   */
  async getAllUsers () {
    try {
      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'security/usergroup/users.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return await response.json();
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Creates a new user.
   *
   * @param {String} username The name of the user to be created
   * @param {String} password The password of the user to be created
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

    try {
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

      if (response.status === 201) {
        return true;
      } else if (response.status === 404) {
        console.warn(`Received HTTP 404 - the user ${username} might already exist.`);
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
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
   * @returns {Boolean} If user could be updated
   */
  async updateUser (username, password, enabled) {
    const body = {
      user: {
        password: password,
        enabled: enabled
      }
    };

    try {
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

      if (response.status === 200) {
        return true;
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Associates the given role to the user.
   *
   * @param {String} username The name of the user to add the role to
   * @param {String} role The role to associate
   *
   * @returns {Boolean} If the role could be associated
   */
  async associateUserRole (username, role) {
    try {
      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      console.log(`${this.url}security/roles/role/${role}/user/${username}`);
      const response = await fetch(`${this.url}security/roles/role/${role}/user/${username}`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return true;
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
