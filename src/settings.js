import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';

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
   * @param {String} auth The Basic Authentication string
   */
  constructor (url, auth) {
    this.url = url;
    this.auth = auth;
  }

  /**
   * Get the complete GeoServer settings object.
   *
   * @throws Error if request fails
   *
   * @returns {Object} Settings object
   */
  async getSettings () {
    const response = await fetch(this.url + 'settings.json', {
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
   * Update the global GeoServer settings.
   *
   * @param {Object} settings The adapted GeoServer settings object
   */
  async updateSettings (settings) {
    const response = await fetch(this.url + 'settings', {
      credentials: 'include',
      method: 'PUT',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Update the global proxyBaseUrl setting.
   *
   * @param {String} proxyBaseUrl The proxy base URL
   */
  async updateProxyBaseUrl (proxyBaseUrl) {
    const settingsJson = await this.getSettings();

    // check if settings are correctly formatted
    if (!settingsJson.global && !settingsJson.global.settings) {
      return false;
    }

    // add proxyBaseUrl to settings
    settingsJson.global.settings.proxyBaseUrl = proxyBaseUrl;

    await this.updateSettings(settingsJson);
  }

  /**
   * Get the contact information of the GeoServer.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with contact information
   */
  async getContactInformation () {
    const response = await fetch(this.url + 'settings/contact', {
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

    const url = this.url + 'settings/contact';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
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
}
