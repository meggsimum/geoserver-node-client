import fetch from 'node-fetch';

/**
 * Client for GeoServer settings.
 *
 * @module SettingsClient
 */
export default class SettingsClient {
  /**
   * Creates a GeoServer REST SettingsClient instance.
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
   * Get the complete GeoServer settings object.
   *
   * @returns {Object|Boolean} Settings object or 'false'
   */
  async getSettings () {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'settings.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });
      return await response.json();
    } catch (error) {
      return false;
    }
  }

  /**
   * Update the global GeoServer settings.
   *
   * @param {GeoServer} settings
   * @returns {Boolean} Flag indicating if request was successful
   */
  async updateSettings (settings) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'settings', {
        credentials: 'include',
        method: 'PUT',
        headers: {
          Authorization: 'Basic ' + auth,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update the global proxyBaseUrl setting.
   *
   * @param {String} proxyBaseUrl The proxy base URL
   * @returns {Boolean} Flag indicating if request was successful
   */
  async updateProxyBaseUrl (proxyBaseUrl) {
    const settingsJson = {
      global: {
        settings: {
          proxyBaseUrl: proxyBaseUrl
        }
      }
    };

    return await this.updateSettings(settingsJson);
  }

  /**
   * Get the contact information of the GeoServer.
   *
   * @returns {Object|Boolean} An object with contact information or 'false'
   */
  async getContactInformation () {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'settings/contact', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });
      return await response.json();
    } catch (error) {
      return false;
    }
  }

  /**
   * Update the contact information.
   *
   * Deleting is not supported.
   *
   * @param {String} [address] The contact's address
   * @param {String} [city] The contact's city
   * @param {String} [country] The contact's country
   * @param {String} [postalCode] The contact's postCode
   * @param {String} [state] The contact's state
   * @param {String} [email] The contact's email
   * @param {String} [organization] The contact's organization
   * @param {String} [contactPerson] The contact person
   * @param {String} [phoneNumber] The contact's phone number
   *
   * @returns {Boolean} If contact information could be updated.
   */
  async updateContactInformation (address, city, country, postalCode, state, email, organization, contactPerson, phoneNumber) {
    try {
      const contact = {
        address: address,
        addressCity: city,
        addressCountry: country,
        addressPostalCode: postalCode,
        addressState: state,
        contactEmail: email,
        contactOrganization: organization,
        contactPerson: contactPerson,
        contactVoice: phoneNumber
      };

      const body = {
        contact: contact
      };

      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const url = this.url + 'settings/contact';
      const response = await fetch(url, {
        credentials: 'include',
        method: 'PUT',
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
      console.log(error);
      return false;
    }
  }
}
