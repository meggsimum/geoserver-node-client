import fetch from 'node-fetch';
import { GeoServerResponseError } from './errors.js';

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
   * @throws Error if request fails
   *
   * @returns {Object|Boolean} Settings object or 'false'
   */
  async getSettings () {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'settings.json', {
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
   * Update the global GeoServer settings.
   *
   * @param {Object} settings The adapted GeoServer settings object
   *
   * @returns {Boolean} Flag indicating if request was successful
   */
  async updateSettings (settings) {
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

    return response.ok;
  }

  /**
   * Update the global proxyBaseUrl setting.
   *
   * @param {String} proxyBaseUrl The proxy base URL
   *
   * @returns {Boolean} Flag indicating if request was successful
   */
  async updateProxyBaseUrl (proxyBaseUrl) {
    const settingsJson = await this.getSettings();

    // check if settings are correctly formatted
    if (!settingsJson.global && !settingsJson.global.settings) {
      return false;
    }

    // add proxyBaseUrl to settings
    settingsJson.global.settings.proxyBaseUrl = proxyBaseUrl;

    return await this.updateSettings(settingsJson);
  }

  /**
   * Get the contact information of the GeoServer.
   *
   * @throws Error if request fails
   *
   * @returns {Object|Boolean} An object with contact information or 'false'
   */
  async getContactInformation () {
    const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'settings/contact', {
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
   * @throws Error if request fails
   *
   * @returns {Boolean} If contact information could be updated.
   */
  async updateContactInformation (address, city, country, postalCode, state, email, organization, contactPerson, phoneNumber) {
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
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Error during request: ${responseText}`);
    }
    return true;
  }
}
