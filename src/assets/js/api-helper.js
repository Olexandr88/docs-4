// Particle API helper with Particle SSO (single-sign-on)
// Allows authenticated API calls from docs

let apiHelper = {};

apiHelper.deviceList = function(elems, options) {
    if (!options) {
        options = {};
    }
    apiHelper.particle.listDevices({ auth: apiHelper.auth.access_token }).then(
        function(data) {
            let html = '';
            data.body.forEach(function(dev) {
                if (!options.deviceFilter || options.deviceFilter(dev)) {
                    const value = options.getValue ? options.getValue(dev) : dev.id;
                    const title = options.getTitle ? options.getTitle(dev) : dev.name;
                    html += '<option value="' + value + '">' + title + '</option>';
                }
            });
            elems.html(html);
        },
        function(err) {

        }
    );
};

apiHelper.flashDevice = function(deviceId, code, codebox) {
    if (!apiHelper.auth) {
        return;
    }

    const setStatus = function(status) {
        $(codebox).find('.codeboxFlashStatus').html(status);
    };
    setStatus('Preparing to flash code...');

    let formData = new FormData();

    let blob = new Blob([code], {type:'text/plain'});
    formData.append('file', blob, 'source.ino');
    
    $.ajax({
        data: formData,
        contentType: false,
        error: function(err) {
            setTimeout(function() {
                setStatus('');
            }, 4000);
        },
        method: 'PUT',
        processData: false,
        success: function (resp) {
            setStatus(resp.message);
            setTimeout(function() {
                setStatus('');
            }, 4000);
        },
        url: 'https://api.particle.io/v1/devices/' + deviceId + "?access_token=" + apiHelper.auth.access_token,
    });    

};


apiHelper.uploadSchemaCodebox = function(schema, product, deviceId, next) {
    if (!apiHelper.auth) {
        return;
    }

    const setStatus = function(status) {
        $('.codeboxFlashStatus').html(status);
    };

    setStatus('Saving backup schema...');

    apiHelper.downloadSchema('backup-schema.json', product, deviceId, function(err) {
        if (!err) {
            setStatus('Uploading schema...');
            apiHelper.uploadSchema(schema, product, deviceId, function(err) {
                if (!err) {
                    setStatus('Schema uploaded!');
                    setTimeout(function() {
                        setStatus('');
                    }, 4000);
                }
                else {
                    setStatus('Error saving schema ' + err);
                    setTimeout(function() {
                        setStatus('');
                    }, 10000);        
                }
            });
        }
        else {
            setStatus('Error saving backup schema ' + err);
            setTimeout(function() {
                setStatus('');
            }, 10000);
        }
    });




};

apiHelper.uploadSchema = function(schema, product, deviceId, next) {
    const deviceIdUrl = (deviceId == 'default') ? '' : '/' + deviceId; 

    $.ajax({
        data: schema,
        error: function(err) {
            next(err.responseJSON.message);
        },
        headers: {
            'Authorization':'Bearer ' + apiHelper.auth.access_token,
            'Content-Type':'application/schema+json'
        },
        method: 'PUT',
        processData: false,
        success: function (resp) {
            next();
        },
        url: 'https://api.particle.io/v1/products/' + product + '/config' + deviceIdUrl
    }); 
};

apiHelper.uploadSchemaFile = function(file, product, deviceId, next) {
    const deviceIdUrl = (deviceId == 'default') ? '' : '/' + deviceId; 

    let fileReader = new FileReader();
    fileReader.onload = function() {
        apiHelper.uploadSchema(fileReader.result, product, deviceId, next);        
    };
    fileReader.readAsText(file);
};

apiHelper.downloadSchema = function(filename, product, deviceId, next) {
    const deviceIdUrl = (deviceId == 'default') ? '' : '/' + deviceId; 

    $.ajax({
        dataType: 'text',
        error: function(err) {
            next(err.responseJSON.message);
        },
        headers: {
            'Accept':'application/schema+json'
        },
        method: 'GET',
        success: function (resp) {
            let blob = new Blob([resp], {type:'text/json'});
            saveAs(blob, filename);
            next();
        },
        url: 'https://api.particle.io/v1/products/' + product + '/config' + deviceIdUrl + '?access_token=' + apiHelper.auth.access_token
    });    
};


apiHelper.ready = function() {
    apiHelper.auth = null;

    // ready is only called if there are components that use the apiHelper

    apiHelper.particle = new Particle();

    $('.apiHelperFakeAuthButton').on('click', function() {
        const authData = prompt('JSON authentication data:');
        if (authData) {
            localStorage.setItem('particleAuth', authData);
            apiHelper.ready();
        }
    });
    
    $('.apiHelperLoginButton').on('click', function() {
        const origUrl = window.location.href;

		window.location.href = 'https://login.particle.io/login?redirect=' + encodeURI(origUrl); 
    });

    $('.apiHelperLogoutButton').on('click', function() {
        Cookies.remove('ember_simple_auth_session', { path: '/', domain: '.particle.io' });
        localStorage.removeItem('particleAuth');
        apiHelper.ready();
    });

    const cookie = Cookies.get('ember_simple_auth_session');
    if (cookie) {
        try {
            const json = JSON.parse(cookie);
            if (json.authenticated) {
                apiHelper.auth = json.authenticated;
            }
        }
        catch(e) {
        }
    }
    const fakeAuth = localStorage.getItem('particleAuth');
    if (fakeAuth) {
        try {
            apiHelper.auth = JSON.parse(fakeAuth);
        }
        catch(e) {
        }
    }

    $('.apiHelperLoggedIn').hide();
    $('.apiHelperCouldSSO').hide();
    $('.apiHelperFakeAuth').hide();

    if (apiHelper.auth) {
        $('.apiHelperUser').text(apiHelper.auth.username);

        $('.apiHelperLoggedIn').show();
    }
    else
    if (window.location.hostname.endsWith('particle.io')) {
        $('.apiHelperCouldSSO').show();
    }
    else {
        $('.apiHelperFakeAuth').show();
    }


    if ($('.apiHelperFunctionTest').length > 0 && apiHelper.auth) {
        const refreshDeviceList = function() {
            apiHelper.deviceList($('.apiHelperLedFunctionTestSelect'), {
                deviceFilter: function(dev) {
                    return dev.functions.includes("led");
                },
                getTitle: function(dev) {
                    return dev.name + (dev.online ? '' : ' (offline)');
                }
            });    
        }
        refreshDeviceList();

        const setStatus = function(status) {
            $('.apiHelperLedFunctionTestStatus').html(status);
        }

        const ledControl = function(elem, cmd) {
            const deviceId = elem.find('select').val();

            setStatus('Sending request: ' + cmd);

            apiHelper.particle.callFunction({ deviceId, name: 'led', argument: cmd, auth: apiHelper.auth.access_token  }).then(
                function (data) {
                    setStatus('Success! (' + data.body.return_value + ')');
                    setTimeout(function() {
                        setStatus('');
                    }, 4000);                
                },
                function (err) {
                    setStatus('Error: ' + err);
                    setTimeout(function() {
                        setStatus('');
                    }, 10000);                
                }
            );            
        };

        $('.apiHelperLedFunctionRefresh').on('click', function() {
            refreshDeviceList();
        });

        $('.apiHelperLedFunctionTestOn').on('click', function() {
            ledControl($(this).closest('div'), 'on');
        });

        $('.apiHelperLedFunctionTestOff').on('click', function() {
            ledControl($(this).closest('div'), 'off');
        });
    }

    if (($('.apiHelperConfigSchema').length > 0 || $('.codeboxConfigSchemaSpan').length > 0) && apiHelper.auth) {
        // 
        const updateDeviceList = function(parentDiv) {
            const product = $(parentDiv).find('.apiHelperConfigSchemaProductSelect').val();
            if (!product) {
                return;
            }
            
            apiHelper.particle.listDevices({ auth: apiHelper.auth.access_token, product:product }).then(
                function(data) {
                    let html = '<option value="default">Product Default</option>';
                    data.body.devices.forEach(function(dev) {
                        html += '<option value="' + dev.id + '">' + dev.name + '</option>';
                    });
                    $(parentDiv).find('.apiHelperConfigSchemaDeviceSelect').html(html);
                },
                function(err) {
        
                }
            );        
            
        };

        $.ajax({
            data: {
                'access_token': apiHelper.auth.access_token
            },
            error: function(err) {
                console.log('getting getting list of products ', err);
            },
            method: 'GET',
            success: function (resp) {
                let html = '';
                resp.products.forEach(function(prod) {
                    if (prod.platform_id == 26) {
                        // Tracker
                        html += '<option value="' + prod.id + '">' + prod.name + ' (' + prod.id + ')</option>';
                    }
                });
                if (html === '') {
                    html = '<option disabled>No Tracker products available</option>'
                    $('.codeboxConfigSchemaSpan').hide();
                }
                else {
                    $('.codeboxConfigSchemaProductSelect').html(html);
                    $('.codeboxConfigSchemaSpan').show();
                }

                $('.apiHelperConfigSchemaProductSelect').html(html);

                $('.apiHelperConfigSchemaProductSelect').each(function(index) {

                    const parentDiv = $(this).closest('div');
                    
                    $(this).on('change', function() {
                        updateDeviceList(parentDiv);
                    });
                    
                    updateDeviceList(parentDiv);
                    
                });

            },
            url: 'https://api.particle.io/v1/user/products',
        });

        const setStatus = function(configSchemaPartial, status) {
            $(configSchemaPartial).find('.apiHelperConfigSchemaStatus').html(status);
        };


        $('.apiHelperConfigSchemaDownload').on('click', function(ev) {
            const configSchemaPartial = $(this).closest('div.apiHelperConfigSchema');

            apiHelper.downloadSchema('schema.json', product, deviceId, function(err) {
                if (!err) {
                    setStatus(configSchemaPartial, 'Downloaded!');
                    setTimeout(function() {
                        setStatus('');
                    }, 4000);    
                }
                else {
                    setStatus(configSchemaPartial, 'Error downloading schema ' + err);
                    setTimeout(function() {
                        setStatus('');
                    }, 10000);
                }
            });
        });    

        $('.apiHelperConfigSchemaUpload').on('click', function() {
            const configSchemaPartial = $(this).closest('div.apiHelperConfigSchema');
            const product = $(configSchemaPartial).find('.apiHelperConfigSchemaProductSelect').val();
            const deviceId = $(configSchemaPartial).find('.apiHelperConfigSchemaDeviceSelect').val();

            setStatus(configSchemaPartial, 'Select schema to upload...');

            $(configSchemaPartial).find('.apiHelperConfigSchemaFileInput').on('change', function() {
                const fileList = this.files[0];

                setStatus(configSchemaPartial, 'Saving backup schema...');

                apiHelper.downloadSchema('backup-schema.json', product, deviceId, function(err) {
                    if (!err) {
                        setStatus(configSchemaPartial, 'Uploading schema...');
                        apiHelper.uploadSchemaFile(fileList, product, deviceId, function(err) {
                            if (!err) {
                                setStatus(configSchemaPartial, 'Schema uploaded!');
                                setTimeout(function() {
                                    setStatus('');
                                }, 4000);
                            }
                            else {
                                setStatus(configSchemaPartial, 'Error saving schema ' + err);
                                setTimeout(function() {
                                    setStatus('');
                                }, 10000);        
                            }
                        });
                    }
                    else {
                        setStatus(configSchemaPartial, 'Error saving backup schema ' + err);
                        setTimeout(function() {
                            setStatus('');
                        }, 10000);
                    }
                });
            });

            $(configSchemaPartial).find('.apiHelperConfigSchemaFileInput').click();
            
        });    

        $('.apiHelperConfigSchemaDefault').on('click', function() {
            const configSchemaPartial = $(this).closest('div.apiHelperConfigSchema');
            const product = $(configSchemaPartial).find('.apiHelperConfigSchemaProductSelect').val();
            const deviceId = $(configSchemaPartial).find('.apiHelperConfigSchemaDeviceSelect').val();
            const deviceIdUrl = (deviceId == 'default') ? '' : '/' + deviceId; 

            setStatus(configSchemaPartial, 'Restoring default schema...');

            $.ajax({
                data: '{}',
                error: function(err) {
                    // console.log('err', err);
                    setStatus(configSchemaPartial, 'Error deleting schema: ' + err.responseJSON.message + '.<br/>This is normal if there is no custom schema defined.');
                    setTimeout(function() {
                        setStatus('');
                    }, 10000);
                },
                headers: {
                    'Authorization':'Bearer ' + apiHelper.auth.access_token,
                    'Content-Type':'application/schema+json'
                },
                method: 'DELETE',
                success: function (resp) {
                    setStatus(configSchemaPartial, 'Successfully restored.');
                    setTimeout(function() {
                        setStatus('');
                    }, 4000);
                },
                url: 'https://api.particle.io/v1/products/' + product + '/config' + deviceIdUrl
            });    
        });    

        $('div.apiHelperConfigSchema').each(function(index) {
            const configSchemaPartial = $(this);
            /*
            $(this).on('dragenter', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('drag enter');
                $(configSchemaPartial).css('border-style: dotted; border-width: 5px')
            });
            $(this).on('dragover', function(e) {
                e.stopPropagation();
                e.preventDefault();
            });
            $(this).on('dragleave', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('drag leave');
                $(configSchemaPartial).css('border-style: none')
            });
            $(this).on('drop', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('drop');
                $(configSchemaPartial).css('border-style: none')

                //uploadSchema(e.originalEvent.dataTransfer.files[0], configSchemaPartial);
            });
            */
        });
        
    }

    if ($('.codeboxFlashDeviceSpan').length > 0) {
        
        $('.codeboxFlashDeviceSpan').hide();

        if (apiHelper.auth) {
            apiHelper.particle.listDevices({ auth: apiHelper.auth.access_token }).then(
                function(data) {
                    let html = '<option value="select" selected>Select Device</option>';
                    data.body.forEach(function(dev) {
                        html += '<option value="' + dev.id + '">' + dev.name + '</option>';
                    });
                    $('.codeboxFlashDeviceSelect').html(html);
                    $('.codeboxFlashDeviceButton').attr('disabled', 'disabled');      
                    
                    if (data.body.length > 0) {
                        $('.codeboxFlashDeviceSelect').on('change', function() {
                            const newVal = $(this).val();
                            $('.codeboxFlashDeviceSelect').val(newVal);
                            if (newVal != 'select') {
                                $('.codeboxFlashDeviceButton').removeAttr('disabled');
                            }
                            else {
                                $('.codeboxFlashDeviceButton').attr('disabled', 'disabled');      
                            }
                        });
                        $('.codeboxFlashDeviceSpan').show();
                    }
                },
                function(err) {        
                }
            );        
        }

    }
};

$(document).ready(function() {
    if ($('.apiHelper').length > 0) {
        apiHelper.ready();
    }
});
