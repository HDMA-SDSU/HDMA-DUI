import requests, cgi, json


#temporary disable warning info in the requests
requests.packages.urllib3.disable_warnings()

print ""





#loggin google api
p12="APIProject-99d635a16f72.p12"
import urllib2
#from apiclient.discovery import build
from oauth2client.client import SignedJwtAssertionCredentials
 
# Here's the file you get from API Console -> Service Account.
with open("APIProject-99d635a16f72.p12") as f:
    key=f.read()

 
# Create an httplib2.Http object to handle our HTTP requests and authorize it
  # with the Credentials. Note that the first parameter, service_account_name,
  # is the Email address created for the Service account. It must be the email
  # address associated with the key that was created.
credentials = SignedJwtAssertionCredentials(
    '641378541028-c8704toua3io13136uh9bio1mnln4289@developer.gserviceaccount.com',
    key,
    scope='https://www.googleapis.com/auth/fusiontables')
http = urllib2.Http()
http = credentials.authorize(http)
 
service = build("fusiontables", "v1", http=http)
# For example, let make SQL query to SELECT ALL from Table with
# id = 1gvB3SedL89vG5r1128nUN5ICyyw7Wio5g1w1mbk
print(service.query().sql(sql='SELECT * FROM 1gvB3SedL89vG5r1128nUN5ICyyw7Wio5g1w1mbk').execute())


'''

google={
    "grant_type":"authorization_code",
    "code":"4/_1Ua8y84h1HpEj070G_qiOLBQbkLwyyDx9IlVc8YWyo.cnToaz9BZnQcEnp6UAPFm0EkpPlJmAI",
    "client_id":"641378541028-har1addb5dmfa0o2hkgnfoj0d0f63aae.apps.googleusercontent.com",
    #"client_email":"641378541028-har1addb5dmfa0o2hkgnfoj0d0f63aae@developer.gserviceaccount.com",
    "client_secret":"0pyREXXumt59oGbUeCwYtVzX",
    "redirect_uri":"https://www.example.com/oauth2callback"
    
}

#get code from google oauth2
#copy past
#https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/fusiontables&client_id=641378541028-har1addb5dmfa0o2hkgnfoj0d0f63aae.apps.googleusercontent.com&response_type=code&redirect_uri=https://www.example.com/oauth2callback&access_type=offline

r=requests.post("https://accounts.google.com/o/oauth2/token", verify=False, data=google, headers={'content-type':'application/x-www-form-urlencoded'})
r=r.json()
print r
#access_token=r["access_token"]


#variables
tableID="1Eg5WpSFKryXCs9PNfdTbeInw8tbnHLDBQCc-X3z3"
key="AIzaSyAqd6BFSfKhHPiGaNUXnSt6jAzQ9q_3DyU"




#params from client request
form = cgi.FieldStorage()
lic_nbr= form["lic_nbr"].value if form["lic_nbr"] is not None else "0100201100"
updateData= form["rows"].value if form["rows"] is not None else None


if(lic_nbr is not None and updateData is not None):
    updateData=updateData.split("|")
 
    
    #query params
    params={
        "key": key,
        "sql": "SELECT * FROM " + tableID +" WHERE lic_lic_cert_nbr="+lic_nbr+""
    }


    #get row data first
    r=requests.get("https://www.googleapis.com/fusiontables/v2/query", params=params, verify=False)
    rowData=r.json()

    #get row id
    params["sql"]="SELECT ROWID FROM " + tableID +" WHERE lic_lic_cert_nbr="+lic_nbr
    r=requests.get("https://www.googleapis.com/fusiontables/v2/query", params=params, verify=False)
    rowID=r.json()["rows"][0][0]
   

    if(rowData is not None and rowID is not None):
        #check each row if it is different with updateData
        updates=[]
        columns=rowData["columns"]
        for i, row in enumerate(rowData["rows"][0]):
            if(str(updateData[i])!=str(row)):
                updates.append(str(columns[i]) + " = " + updateData[i])
                
                print "original= " + str(row)
                print "update= " + str(updateData[i])
                print "-----------------------------------"

        #make query sql
        updateSQL="UPDATE " + tableID +" SET " + ', '.join(updates) + " WHERE ROWID='"+ rowID +"'"

        #update
        params["sql"]=updateSQL
        r=requests.post("https://www.googleapis.com/fusiontables/v2/query", params=params, headers={"Authorization": access_token})
        print r.json()

'''
