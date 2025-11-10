import subprocess
import sys
import os

def offline_process(params=None):
    params = params or {}

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))
    default_input_dir = os.path.join(project_root, 'SatDumpIn')
    default_output_dir = os.path.join(project_root, 'SatDumpOut', 'offline')

    pipeline = params.get('pipeline')
    input_level = params.get('inputLevel')
    input_file = params.get('inputFile')
    output_dir = params.get('outputDir', default_output_dir)

    if not pipeline or not input_level or not input_file:
        raise ValueError('pipeline, inputLevel, and inputFile are required for offline_process')

    if not os.path.isabs(input_file):
        input_file = os.path.join(default_input_dir, input_file)

    if not os.path.exists(input_file):
        raise FileNotFoundError(f'Offline input file not found: {input_file}')

    if not os.path.isabs(output_dir):
        output_dir = os.path.join(default_output_dir, output_dir)

    os.makedirs(output_dir, exist_ok=True)

    cmd = ['satdump', pipeline, input_level, input_file, output_dir]

    samplerate = params.get('samplerate')
    if samplerate not in (None, '', 'null'):
        cmd += ['--samplerate', str(samplerate)]

    baseband_format = params.get('basebandFormat')
    if baseband_format:
        cmd += ['--baseband_format', str(baseband_format)]

    if params.get('dcBlock'):
        cmd.append('--dc_block')

    freq_shift = params.get('freqShift')
    if freq_shift not in (None, '', 'null'):
        cmd += ['--freq_shift', str(freq_shift)]

    if params.get('iqSwap'):
        cmd.append('--iq_swap')

    extra_args = params.get('extraArgs')
    if isinstance(extra_args, str) and extra_args.strip():
        cmd += extra_args.split()

    print(f"Starting offline process with args: {cmd}")
    print("Offline process output will be displayed below:")
    print("=" * 50)

    try:
        p = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=False,
            bufsize=1,
            universal_newlines=True
        )

        while True:
            output_line = p.stdout.readline()
            if output_line == '' and p.poll() is not None:
                break
            if output_line:
                print(f"[OFFLINE] {output_line.strip()}")
                sys.stdout.flush()

        final_output, final_error = p.communicate()

        print("=" * 50)
        if p.returncode == 0:
            print("Offline process completed successfully")
            if final_output:
                print(f"Final output: {final_output.strip()}")
        else:
            print(f"Offline process failed with return code: {p.returncode}")
            if final_error:
                print(f"Final error: {final_error.strip()}")

        return p.returncode
    except Exception as e:
        print(f"Exception in offline_process: {str(e)}")
        raise

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

def record_process(params=None):
    params = params or {}

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))
    default_record_dir = os.path.join(project_root, 'SatDumpIn', 'recordings')

    output_baseband = params.get('outputName')
    if not output_baseband:
        raise ValueError('outputName is required for record_process')

    if not os.path.isabs(output_baseband):
        output_baseband = os.path.join(default_record_dir, output_baseband)

    record_dir = os.path.dirname(output_baseband)
    if record_dir:
        os.makedirs(record_dir, exist_ok=True)

    source = str(params.get('source', 'rtlsdr'))
    sample_rate = params.get('sampleRate')
    frequency = params.get('frequency')
    baseband_format = str(params.get('basebandFormat', 'w16'))
    timeout = params.get('timeout')
    bit_depth = params.get('bitDepth')
    extra_args = params.get('extraArgs', '')

    if sample_rate is None or frequency is None:
        raise ValueError('sampleRate and frequency are required for record_process')

    def to_string(value):
        return str(value)

    cmd = [
        'satdump', 'record', output_baseband,
        '--source', source,
        '--samplerate', to_string(sample_rate),
        '--frequency', to_string(frequency),
        '--baseband_format', baseband_format
    ]

    if baseband_format == 'ziq' and bit_depth is not None:
        cmd += ['--bit_depth', to_string(bit_depth)]

    if timeout is not None:
        cmd += ['--timeout', to_string(timeout)]

    if isinstance(extra_args, str) and extra_args.strip():
        cmd += extra_args.split()

    print(f"Starting record process with args: {cmd}")
    print("Record process output will be displayed below:")
    print("=" * 50)

    try:
        p = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=False,
            bufsize=1,
            universal_newlines=True
        )

        while True:
            output_line = p.stdout.readline()
            if output_line == '' and p.poll() is not None:
                break
            if output_line:
                print(f"[RECORD] {output_line.strip()}")
                sys.stdout.flush()

        final_output, final_error = p.communicate()

        print("=" * 50)
        if p.returncode == 0:
            print("Record process completed successfully")
            if final_output:
                print(f"Final output: {final_output.strip()}")
        else:
            print(f"Record process failed with return code: {p.returncode}")
            if final_error:
                print(f"Final error: {final_error.strip()}")

        return p.returncode
    except Exception as e:
        print(f"Exception in record_process: {str(e)}")
        raise
