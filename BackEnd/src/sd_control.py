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

def live_process(params=None):
    params = params or {}

    # Compute default output directory relative to repo root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))
    default_out_dir = os.path.join(project_root, 'SatDumpOut', 'test')

    # Defaults
    pipeline = str(params.get('pipeline', 'generic_analog_demod'))
    out_dir = str(params.get('outDir', default_out_dir))
    source = str(params.get('source', 'rtlsdr'))
    frequency = params.get('frequency', '100.7e6')     # e.g., "100.7e6" or 100700000
    sample_rate = params.get('sampleRate', '2.4e6')    # e.g., "2.4e6" or 2400000
    gain = params.get('gain', 30)
    timeout = params.get('timeout', 30)
    extra_args = params.get('extraArgs', '')

    # Normalize types to strings
    def as_str(v):
        return str(v)

    os.makedirs(out_dir, exist_ok=True)

    # Build argument list (safer than a shell string on Windows)
    cmd = [
        'satdump', 'live', pipeline, out_dir,
        '--source', source
    ]

    if frequency is not None:
        cmd += ['--frequency', as_str(frequency)]
    if sample_rate is not None:
        cmd += ['--samplerate', as_str(sample_rate)]
    if gain is not None:
        cmd += ['--gain', as_str(gain)]
    if timeout is not None:
        cmd += ['--timeout', as_str(timeout)]

    # Allow arbitrary extra args as a single string (split on whitespace)
    if isinstance(extra_args, str) and extra_args.strip():
        cmd += extra_args.split()

    print(f"Starting live process with args: {cmd}")
    print("Live process output will be displayed below:")
    print("=" * 50)

    try:
        p = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # Combine stderr with stdout
            shell=False,               # Use direct exec of list
            bufsize=1,                 # Line buffered
            universal_newlines=True    # Text mode
        )

        # Read output line by line in real-time
        while True:
            output_line = p.stdout.readline()
            if output_line == '' and p.poll() is not None:
                break
            if output_line:
                print(f"[LIVE] {output_line.strip()}")
                sys.stdout.flush()

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
