import subprocess
import sys
import os

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
    command = r'satdump live generic_analog_demod "C:\Users\Justin Isa\Desktop\Coding Files\3D-Printed-Satellite-Antenna-and-Tracking-System-BothEnds\SatDumpOut\test" --source rtlsdr --frequency 100.7e6 --samplerate 2.4e6 --gain 30 --timeout 30'
    
    print(f"Starting live process with command: {command}")
    print("Live process output will be displayed below:")
    print("=" * 50)
    
    try:
        p = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # Combine stderr with stdout
            shell=True,
            bufsize=1,  # Line buffered
            universal_newlines=True  # Text mode
        )
        
        # Read output line by line in real-time
        while True:
            output_line = p.stdout.readline()
            if output_line == '' and p.poll() is not None:
                break
            if output_line:
                print(f"[LIVE] {output_line.strip()}")
                sys.stdout.flush()  # Force immediate output
        
        # Get final output
        final_output, final_error = p.communicate()
        
        print("=" * 50)
        if p.returncode == 0:
            print("Live process completed successfully")
            if final_output:
                print(f"Final output: {final_output.strip()}")
        else:
            print(f"Live process failed with return code: {p.returncode}")
            if final_error:
                print(f"Final error: {final_error.strip()}")
                
        # Return the return code so flask_app can track it
        return p.returncode
                
    except Exception as e:
        print(f"Exception in live_process: {str(e)}")
        raise

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
