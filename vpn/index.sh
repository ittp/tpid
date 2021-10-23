# Get ca.crt
export DIR=/mnt/openvpn
export CA_CERT=$DIR/pki/ca.crt
export CA_KEY=$DIR/pki/private/ca.key
  
export DH=/pki/dh.pem

export CLIENT_NAME="OW1"
export CLIENT_KEY=/pki/private/${CLIENT_NAME}.key


get_ca() {
echo "CA_CERT"
  cat ${CA_CERT}

}

get_ca_key() {
  cat ${CA_KEY}
echo "KEY"

}
get_dh() {
  cat ${DH}
echo "DH"

}

get_client_key() {
echo "CL"

  cat ${CLIENT_KEY}
}
