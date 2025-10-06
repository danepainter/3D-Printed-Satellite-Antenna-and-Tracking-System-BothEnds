import subprocess

def offline_process():
    p = subprocess.Popen('satdump meteor_hrpt cadu "C:/Users/Justin Isa/Downloads/crosswalkersam_meteor_hrpt_2022_04_08_14_14_42.cadu" "C:/Users/Justin Isa/Desktop/SatDumpTest" --samplerate 3000000',
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
    #the commented code is for the cadu format meteor satellite
    '''p = subprocess.Popen('satdump live cadu "C:/Users/Justin Isa/Desktop/SatDumpTest" --source rtlsdr --frequency 1700e6 --samplerate 3e6 --gain 40 --http_server 0.0.0.0:3000',
    stdin = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        shell = True)'''

    #this code is test code for the file, records regular fm radio
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
    #the commented code is for the cadu format meteor satellite
    '''p = subprocess.Popen('satdump record cadu "C:/Users/Justin Isa/Desktop/SatDumpTest" --source rtlsdr --frequency 1700e6 --samplerate 3e6 --gain 40',
            stdin = subprocess.PIPE,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        shell = True)'''
    
    #this code is test code for the file, records regular fm radio    
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
