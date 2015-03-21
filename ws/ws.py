import requests, cgi, json,os


#temporary disable warning info in the requests
#requests.packages.urllib3.disable_warnings()
import warnings
warnings.filterwarnings("ignore")


#to avoid the error: You can change the cache directory by setting the PYTHON_EGG_CACHE environment variable to point to an accessible directory.
os.environ['PYTHON_EGG_CACHE'] = '/tmp'


print ""


#===========================================================================================
def googleLogin():
    
    #login and use google api
    p12=os.path.join(os.path.dirname(os.path.realpath(__file__)),"key1.pem") #"D:\\github\\hdma-dui\\ws\\key1.pem"
    
    import httplib2
    from apiclient.discovery import build
    from oauth2client.client import SignedJwtAssertionCredentials
     
    # Here's the file you get from API Console -> Service Account.
    with open(p12) as f:
        key=f.read()

     
    # Create an httplib2.Http object to handle our HTTP requests and authorize it
      # with the Credentials. Note that the first parameter, service_account_name,
      # is the Email address created for the Service account. It must be the email
      # address associated with the key that was created.
    credentials = SignedJwtAssertionCredentials(
        '641378541028-c8704toua3io13136uh9bio1mnln4289@developer.gserviceaccount.com',
        key,
        scope='https://www.googleapis.com/auth/fusiontables')
    http = httplib2.Http()
    http = credentials.authorize(http)
     
    return build("fusiontables", "v2", http=http)

    #print(googleService.query().sql(sql='SELECT * FROM 1gvB3SedL89vG5r1128nUN5ICyyw7Wio5g1w1mbk').execute())
#===========================================================================================

#update data
def updateData(form):
    lic_nbr= form["lic_nbr"].value if form["lic_nbr"] is not None else "0100201100"
    updateData= form["rows"].value if form["rows"] is not None else None

    tableID="1Eg5WpSFKryXCs9PNfdTbeInw8tbnHLDBQCc-X3z3"
    apiKey="AIzaSyAqd6BFSfKhHPiGaNUXnSt6jAzQ9q_3DyU"

    if(lic_nbr is not None and updateData is not None):
        updateData=updateData.split("|")
        inputObject={}
        for r in updateData:
            t=r.split('===')
            inputObject[t[0]]=t[1]

        
        #query params
        params={
            "key": apiKey,
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
                col=columns[i]
                if col in inputObject:
                    if(str(inputObject[col])!=str(row)):
                        updates.append(str(col) + "='" + inputObject[col]+"'")


            #output
            output={
                "updateRow":{
                    "rowID": rowID,
                    "values": updates
                },
                "response":None
            }


            #check if there is any updates from client sides   
            if(len(updates)>0):
                #google login
                googleService=googleLogin()
                
                #make query sql
                updateSQL="UPDATE " + tableID +" SET " + ', '.join(updates) + " WHERE ROWID='"+ rowID +"'"


                #update
                if(googleService is not None):
                    output["response"]=googleService.query().sql(sql=updateSQL).execute()
            


            #output results
            return output
#===========================================================================================

#login
def login(form):
    tableID_userAccount="1dcHBafxUnjkwRVokWA-6uztkb_ZE2YYDb5K0rWIo"
    username= form["username"].value if form["username"] is not None else None
    password= form["password"].value if form["password"] is not None else None

    return {"username":username, "password":password }

#===========================================================================================



#params from client request
form = cgi.FieldStorage()
serviceType=form["type"].value if form["type"] is not None else None
output={"error": "cannot execute !!"}


if(serviceType is not None):
    if(serviceType=='updateData'):
        output=updateData(form)
    if(serviceType=='login'):
        output=login(form)


print json.dumps(output)
