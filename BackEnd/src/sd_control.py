import subprocess

def offline_process():
    #offline processing for meteor satellite data
    p = subprocess.Popen('satdump meteor_hrpt cadu "SatDumpIn\crosswalkersam_meteor_hrpt_2022_04_08_14_14_42.cadu" "SatDumpOut" --samplerate 3000000',
        stdin = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        shell = True)
    
    output, error = p.communicate()
    if p.returncode == 0:
        print("Success")
    else:
        print("Error: ", error)
        print("Output: ", output)

def live_process():
    #this is for meteor satellite data
    '''p = subprocess.Popen('satdump live cadu "C:/Users/Justin Isa/Desktop/SatDumpTest" --source rtlsdr --frequency 1700e6 --samplerate 3e6 --gain 40 --http_server 0.0.0.0:3000',
    stdin = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        shell = True)'''
        
        #this is for fm radio , testing function
    p = subprocess.Popen('satdump live generic_analog_demod "C:/Users/Justin Isa/Desktop/SatDumpOutputs" --source rtlsdr --frequency 100.7e6 --samplerate 2.4e6 --gain 30 --timeout 30',
        stdin = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        shell = True)


    output, error = p.communicate()
    if p.returncode == 0:
        print("Success")
    else:
        print("Error: ", error)
        print("Output: ", output)

def record_process():
    #this is for meteor satellite data
    '''p = subprocess.Popen('satdump record cadu "C:/Users/Justin Isa/Desktop/SatDumpTest" --source rtlsdr --frequency 1700e6 --samplerate 3e6 --gain 40',
            stdin = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        shell = True)'''

        #this is for fm radio , testing function
    p = subprocess.Popen('satdump record record_testing  --source rtlsdr --frequency 100.7e6 --samplerate 2e6 --gain 30 --timeout 30 --baseband_format w16',
        stdin = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        shell = True)

    output, error = p.communicate()
    if p.returncode == 0:
        print("Success")
    else:
        print("Error: ", error)
        print("Output: ", output)
