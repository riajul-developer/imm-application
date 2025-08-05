import axios from 'axios'

const SMS_API_URL = process.env.SMS_API_URL || 'https://api.sms.net.bd/sendsms'
const SMS_API_KEY = process.env.SMS_API_KEY || '8WRwTZp25gh4V4v8Yk7c5gk2LEM025eyVKA6i1H5'

export const sendSMS = async (to: string, message: string) => {
  try {
    
    const formattedNumber = to.startsWith('01') ? `880${to}` : to

    const response = await axios.post(SMS_API_URL, {
      api_key: SMS_API_KEY,
      msg: message,
      to: formattedNumber
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.error === 0) {
      return response.data
    } else {
      throw new Error(response.data.msg || 'SMS sending failed')
    }

  } catch (error) {
    throw error
  }
}

