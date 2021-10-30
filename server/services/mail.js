'use strict'

const db = require('../utils/db.js').db,
      logger = require('../utils/logger.js')('mail'),
      sgMail = require('@sendgrid/mail')

const COLLECTION_NAME = 'email_templates'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

class MailSrv {
  static async send(type, to, data = {}){
    if (!type)
      throw new Error(`Invalid mail type`)

    if (!to)
      throw new Error(`Missing destination address`)

    if (!data.host)
      data.host = '__HOST__'

    try{
      logger.log('load template',  {type, to})
      const mailObj = await db.collection('email_templates').findOne({type: type, lang: 'fr'})
      if (!mailObj)
        throw new Error(`No template for type '${type}'`)

      const msg = {
        from: 'Vinisync<contact@vinisync.fr>',
        to: to,
        subject: replacePatterns(mailObj.subject, data),
        html: replacePatterns(mailObj.body, data),
        text: replacePatterns(mailObj.plain, data)
      }

      // logger.log(msg)
      await sgMail.send(msg)

    }
    catch(ex){
      throw ex
    }
  }
}

function replacePatterns(text, data){
  if (!text) return ''
  Object.entries(data).forEach(([key, value]) => {
    text = text.replaceAll('{{' + key.toUpperCase() + '}}', value)
  })
  return text
}

module.exports = exports = MailSrv
