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
  constructor(url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;
  }

  /**
   * Get the contact information of the GeoServer.
   */
  async getContactInformation() {
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
   */
  async updateContactInformation(address, city, country, postalCode, state, email, organization, contactPerson, phoneNumber) {
    try {
      let contact = {};
      contact.address = address;
      contact.addressCity = city;
      contact.addressCountry = country;
      contact.addressPostalCode = postalCode;
      contact.addressState = state;
      contact.contactEmail = email;
      contact.contactOrganization = organization;
      contact.contactPerson = contactPerson;
      contact.contactVoice = phoneNumber;

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
