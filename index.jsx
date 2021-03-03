import btClient from 'braintree-web/client'
import btHostedFields from 'braintree-web/hosted-fields'
import btThreeDSecure from 'braintree-web/three-d-secure'

function recreateNode(el) {
  var newEl = el.cloneNode(false)
  while (el.hasChildNodes()) newEl.appendChild(el.firstChild)
  el.parentNode.replaceChild(newEl, el)
}
const braintree = {
  client: btClient,
  hostedFields: btHostedFields,
  threeDSecure: btThreeDSecure
}

const instances = {
  client: null,
  hostedFields: null,
  threeDSecure: null,
}

function init(token) {
  if (instances.client) {
    console.log('was initialized, tearing down')
    instances.threeDSecure.teardown()
    instances.hostedFields.teardown()
    instances.client.teardown(() => {
      instances.client = null
      instances.threeDSecure = null
      instances.hostedFields = null
      console.log('re-init')
      init(token)
    })
    return
  }
  console.log('initializing')

  var form = document.getElementById('my-sample-form')

  braintree.client.create({
    authorization: token,
  }, clientDidCreate)

  function clientDidCreate(err, client) {
    if (err) console.log(err)
    braintree.hostedFields.create({
      client: client,
      styles: {
        'input': {
          'font-size': '16pt',
          'color': '#3A3A3A',
        },

        '.number': {
          'font-family': 'monospace',
        },

        '.valid': {
          'color': 'green',
        },
      },
      fields: {
        number: {
          selector: '#card-number',
        },
        cvv: {
          selector: '#cvv',
        },
        expirationDate: {
          selector: '#expiration-date',
        },
      },
    }, hostedFieldsDidCreate.bind(this, client))
  }

  function hostedFieldsDidCreate(client, err, hostedFields) {
    if (err) console.log(err)

    braintree.threeDSecure.create({
      client,
      version: 2,
    }, (threeDSecureErr, threeDSecureInstance) => {
      if (threeDSecureErr !== null) {
        console.log(threeDSecureErr)
        return
      }
      instances.client = client
      instances.hostedFields = hostedFields
      instances.threeDSecure = threeDSecureInstance

      // we need to recreate submit, to remove all previous listeners
      recreateNode(document.getElementById('my-submit'))
      document.getElementById('my-submit').addEventListener('click', submitHandler.bind(null, hostedFields, threeDSecureInstance))
      document.getElementById('my-submit').removeAttribute('disabled')
    })

  }

  function onThreeDSecureVerification(threeDSecureErr, threeDSecureVerification, payload) {
    if (threeDSecureErr !== null) {
      console.log('BT 3ds error', payload, threeDSecureErr)
      alert(threeDSecureErr.message)
      return
    }
    const {liabilityShifted, liabilityShiftPossible} = threeDSecureVerification
    if (liabilityShiftPossible) {
      if (liabilityShifted) {
        console.log('3D secure: ok')
      } else {
        console.log(threeDSecureVerification, threeDSecureErr)
        alert('Authorization was declined.')
        return
      }
    } else {
      // not participating in 3d secure
      console.log('3D secure: not participating')
    }
    payload.nonce = threeDSecureVerification.nonce
    form['payment_method_nonce'].value = payload.nonce
    form.submit()
  }

  function submitHandler(hostedFields, threeDSecureInstance, event) {
    event.preventDefault()
    document.getElementById('my-submit').setAttribute('disabled', 'disabled')

    hostedFields.tokenize((err, payload) => {
      if (err) {
        document.getElementById('my-submit').removeAttribute('disabled')
        console.error(err)
      } else {

        threeDSecureInstance.verifyCard({
          amount: 6.99,
          bin: payload.details.bin,
          nonce: payload.nonce,

          onLookupComplete: function(data, next) {
            console.log('on lookup complete', data)
            next()
          }
        }, (err, verification) => onThreeDSecureVerification(err, verification, payload))

      }
    })
  }
}

window.onload = () => {

  async function token1() {
    return 'token_for_merchant_1'
  }


  async function token2() {
    return 'token for metchant 2'
  }


  document.getElementById('token1').onclick = async() => {
    init(await token1())
  }
  document.getElementById('token2').onclick = async() => {
    init(await token2())
  }
}
